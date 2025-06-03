from typing import List, Dict, Any
import random
import openai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

# Fort mission templates
FORT_MISSION_TEMPLATES = [
    {
        "type": "scout",
        "description": "Scout the surrounding area for potential threats or resources",
        "difficulty": "medium",
        "required_skills": ["navigation", "stealth"],
        "potential_outcomes": ["success", "partial_success", "failure"],
        "rewards": {
            "success": {"resources": 2, "trust": 1, "morale": 1},
            "partial_success": {"resources": 1, "trust": 0, "morale": 0},
            "failure": {"resources": 0, "trust": -1, "morale": -1}
        }
    },
    {
        "type": "gather",
        "description": "Gather resources from the surrounding area",
        "difficulty": "easy",
        "required_skills": ["foraging", "strength"],
        "potential_outcomes": ["success", "partial_success", "failure"],
        "rewards": {
            "success": {"resources": 3, "trust": 1, "morale": 1},
            "partial_success": {"resources": 1, "trust": 0, "morale": 0},
            "failure": {"resources": 0, "trust": -1, "morale": -1}
        }
    },
    {
        "type": "defend",
        "description": "Defend the fort from potential threats",
        "difficulty": "hard",
        "required_skills": ["combat", "leadership"],
        "potential_outcomes": ["success", "partial_success", "failure"],
        "rewards": {
            "success": {"resources": 1, "trust": 2, "morale": 2},
            "partial_success": {"resources": 0, "trust": 1, "morale": 1},
            "failure": {"resources": -1, "trust": -2, "morale": -2}
        }
    },
    {
        "type": "negotiate",
        "description": "Negotiate with local inhabitants for resources or information",
        "difficulty": "medium",
        "required_skills": ["persuasion", "knowledge"],
        "potential_outcomes": ["success", "partial_success", "failure"],
        "rewards": {
            "success": {"resources": 2, "trust": 2, "morale": 1},
            "partial_success": {"resources": 1, "trust": 1, "morale": 0},
            "failure": {"resources": 0, "trust": -1, "morale": -1}
        }
    },
    {
        "type": "heal",
        "description": "Provide medical assistance to fort inhabitants",
        "difficulty": "medium",
        "required_skills": ["medicine", "empathy"],
        "potential_outcomes": ["success", "partial_success", "failure"],
        "rewards": {
            "success": {"resources": 1, "trust": 2, "morale": 2},
            "partial_success": {"resources": 0, "trust": 1, "morale": 1},
            "failure": {"resources": 0, "trust": -1, "morale": -1}
        }
    },
    {
        "type": "build",
        "description": "Help improve fort defenses or structures",
        "difficulty": "medium",
        "required_skills": ["crafting", "strength"],
        "potential_outcomes": ["success", "partial_success", "failure"],
        "rewards": {
            "success": {"resources": 1, "trust": 2, "morale": 1},
            "partial_success": {"resources": 0, "trust": 1, "morale": 0},
            "failure": {"resources": 0, "trust": -1, "morale": -1}
        }
    },
    {
        "type": "investigate",
        "description": "Investigate suspicious activity around the fort",
        "difficulty": "hard",
        "required_skills": ["perception", "stealth"],
        "potential_outcomes": ["success", "partial_success", "failure"],
        "rewards": {
            "success": {"resources": 1, "trust": 2, "morale": 1, "suspicion": -1},
            "partial_success": {"resources": 0, "trust": 1, "morale": 0, "suspicion": 0},
            "failure": {"resources": 0, "trust": -1, "morale": -1, "suspicion": 1}
        }
    },
    {
        "type": "entertain",
        "description": "Provide entertainment to boost morale",
        "difficulty": "easy",
        "required_skills": ["performance", "empathy"],
        "potential_outcomes": ["success", "partial_success", "failure"],
        "rewards": {
            "success": {"resources": 0, "trust": 1, "morale": 3},
            "partial_success": {"resources": 0, "trust": 0, "morale": 1},
            "failure": {"resources": 0, "trust": -1, "morale": -1}
        }
    }
]

def generate_fort_missions(game_state: Dict[str, Any], num_missions: int = 4) -> List[Dict[str, Any]]:
    """
    Generate fort missions based on game state and companion traits
    
    Args:
        game_state: Current game state including characters and their traits
        num_missions: Number of missions to generate (default: 4)
        
    Returns:
        List of mission objects
    """
    # Get available companions from game state
    companions = game_state.get("characters", [])
    
    # Select random missions from templates
    selected_templates = random.sample(FORT_MISSION_TEMPLATES, min(num_missions, len(FORT_MISSION_TEMPLATES)))
    
    missions = []
    for template in selected_templates:
        # Create a mission based on the template
        mission = {
            "id": f"mission_{len(missions)}",
            "type": template["type"],
            "description": template["description"],
            "difficulty": template["difficulty"],
            "required_skills": template["required_skills"],
            "assigned_character": None,
            "status": "available",
            "outcome": None,
            "rewards": template["rewards"]
        }
        
        # Enhance mission description with AI if available
        try:
            enhanced_description = enhance_mission_description(mission, game_state)
            mission["description"] = enhanced_description
        except Exception as e:
            print(f"Error enhancing mission description: {e}")
        
        missions.append(mission)
    
    return missions

def enhance_mission_description(mission: Dict[str, Any], game_state: Dict[str, Any]) -> str:
    """
    Enhance mission description using AI based on game state and mission type
    
    Args:
        mission: Mission object
        game_state: Current game state
        
    Returns:
        Enhanced mission description
    """
    try:
        # Get fort context from game state
        fort_context = game_state.get("current_location", {}).get("fort", {})
        fort_name = fort_context.get("name", "the fort")
        fort_type = fort_context.get("type", "military")
        
        # Create prompt for OpenAI
        prompt = f"""
        You are a mission generator for a game set in the Oregon Trail era.
        
        Fort Context:
        - Fort Name: {fort_name}
        - Fort Type: {fort_type}
        
        Generate a detailed, historically accurate description for a {mission['type']} mission at this fort.
        The mission should be challenging but achievable, and should fit the historical context of the Oregon Trail era.
        
        Mission Type: {mission['type']}
        Base Description: {mission['description']}
        Required Skills: {', '.join(mission['required_skills'])}
        
        Provide a 2-3 sentence description that makes this mission feel specific to this fort and the historical period.
        """
        
        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a mission generator for a historical game."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error enhancing mission description: {e}")
        return mission["description"]

def process_mission_outcome(mission: Dict[str, Any], character: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process mission outcome based on character traits and mission requirements
    
    Args:
        mission: Mission object
        character: Character object
        
    Returns:
        Mission outcome with rewards
    """
    # Get character skills
    character_skills = character.get("skills", {})
    
    # Calculate success probability based on character skills and mission requirements
    required_skills = mission["required_skills"]
    skill_match_count = sum(1 for skill in required_skills if skill in character_skills)
    skill_match_percentage = skill_match_count / len(required_skills)
    
    # Add randomness factor
    random_factor = random.random()
    success_score = skill_match_percentage * 0.7 + random_factor * 0.3
    
    # Determine outcome
    if success_score > 0.7:
        outcome = "success"
    elif success_score > 0.4:
        outcome = "partial_success"
    else:
        outcome = "failure"
    
    # Get rewards for this outcome
    rewards = mission["rewards"][outcome]
    
    # Generate outcome description
    outcome_description = generate_outcome_description(mission, character, outcome)
    
    return {
        "outcome": outcome,
        "description": outcome_description,
        "rewards": rewards
    }

def generate_outcome_description(mission: Dict[str, Any], character: Dict[str, Any], outcome: str) -> str:
    """
    Generate a description of the mission outcome
    
    Args:
        mission: Mission object
        character: Character object
        outcome: Mission outcome (success, partial_success, failure)
        
    Returns:
        Outcome description
    """
    try:
        # Create prompt for OpenAI
        prompt = f"""
        You are a mission outcome generator for a game set in the Oregon Trail era.
        
        Generate a brief, historically accurate description of a {outcome} outcome for a {mission['type']} mission.
        The description should be 1-2 sentences and should reflect the character's skills and the mission's difficulty.
        
        Character Name: {character.get('name', 'Unknown')}
        Mission Type: {mission['type']}
        Mission Description: {mission['description']}
        Outcome: {outcome}
        
        Provide a concise description that fits the historical period and the specific outcome.
        """
        
        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a mission outcome generator for a historical game."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=100,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating outcome description: {e}")
        return f"The mission resulted in a {outcome} outcome." 