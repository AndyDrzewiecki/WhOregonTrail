from typing import List, Dict, Optional
import openai
from models.Character import Character

class NarrativeService:
    def __init__(self, api_key: str):
        openai.api_key = api_key

    async def generate_character_background(self, character: Character) -> str:
        """Generate a detailed background story for a character."""
        prompt = f"""
        Create a detailed background story for a character with the following traits:
        Religion: {character.traits.religion}
        Identity: {character.traits.identity}
        Morality: {character.traits.morality}
        Skills: {', '.join(character.traits.skills)}
        Fears: {', '.join(character.traits.fears)}
        Desires: {', '.join(character.traits.desires)}
        
        The story should be engaging, dramatic, and explain how they became a sex worker
        traveling to Oregon. Keep it tasteful but include some adult themes.
        """

        response = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a creative writer crafting character backgrounds for an adult-themed game."},
                {"role": "user", "content": prompt}
            ]
        )

        return response.choices[0].message.content

    async def generate_event(self, characters: List[Character], game_state: Dict) -> Dict:
        """Generate a random event based on current game state and characters."""
        character_info = "\n".join([
            f"{char.character_name}: {char.background[:100]}..."
            for char in characters
        ])

        prompt = f"""
        Generate a random event for a group of sex workers traveling to Oregon.
        Current game state:
        - Food: {game_state.get('food', 100)}
        - Water: {game_state.get('water', 100)}
        - Morale: {game_state.get('morale', 100)}
        - Health: {game_state.get('health', 100)}
        
        Characters:
        {character_info}
        
        Create an event with:
        1. A title
        2. A description
        3. 2-3 choices with outcomes
        4. Impact on health, morale, and relationships
        """

        response = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a game designer creating events for an adult-themed Oregon Trail game."},
                {"role": "user", "content": prompt}
            ]
        )

        # Parse the response and structure it
        # This is a simplified version - in reality, you'd want more robust parsing
        content = response.choices[0].message.content
        lines = content.split('\n')
        
        event = {
            "title": lines[0],
            "description": lines[1],
            "choices": [
                {
                    "text": lines[i],
                    "outcome": lines[i + 1],
                    "health_modifier": -10,
                    "morale_modifier": -5,
                    "relationship_modifier": 0
                }
                for i in range(2, len(lines), 2)
            ]
        }

        return event

    async def generate_dialog(self, character: Character, context: str) -> str:
        """Generate dialog for a character based on context."""
        prompt = f"""
        Generate dialog for a character with the following traits:
        Name: {character.character_name}
        Religion: {character.traits.religion}
        Identity: {character.traits.identity}
        Morality: {character.traits.morality}
        
        Context: {context}
        
        The dialog should reflect their personality and background.
        """

        response = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are writing dialog for an adult-themed game character."},
                {"role": "user", "content": prompt}
            ]
        )

        return response.choices[0].message.content

    async def generate_relationship_event(self, character1: Character, character2: Character) -> Dict:
        """Generate an event that affects the relationship between two characters."""
        prompt = f"""
        Create an event that affects the relationship between two characters:
        
        Character 1: {character1.character_name}
        - Religion: {character1.traits.religion}
        - Identity: {character1.traits.identity}
        - Morality: {character1.traits.morality}
        
        Character 2: {character2.character_name}
        - Religion: {character2.traits.religion}
        - Identity: {character2.traits.identity}
        - Morality: {character2.traits.morality}
        
        Create an event that could strengthen or strain their relationship.
        Include:
        1. Event description
        2. Possible outcomes
        3. Relationship impact
        """

        response = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are creating relationship events for an adult-themed game."},
                {"role": "user", "content": prompt}
            ]
        )

        # Parse and structure the response
        content = response.choices[0].message.content
        lines = content.split('\n')
        
        event = {
            "description": lines[0],
            "outcomes": lines[1:],
            "relationship_impact": 10  # Default impact, should be calculated based on outcome
        }

        return event 