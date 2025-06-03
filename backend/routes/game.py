from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import random

router = APIRouter()

class CharacterStats(BaseModel):
    health: float
    morale: float
    stamina: float
    charisma: float
    intelligence: float
    strength: float

class CharacterTraits(BaseModel):
    religion: str
    identity: str
    morality: str
    skills: List[str]
    fears: List[str]
    desires: List[str]

class Character(BaseModel):
    character_id: str
    character_name: str
    background: str
    stats: CharacterStats
    traits: CharacterTraits
    relationships: Dict[str, float]

class GameState(BaseModel):
    food: float
    water: float
    morale: float
    health: float
    coins: int
    player_characters: List[Character]
    ai_characters: List[Character]
    distance_traveled: float

class EventChoice(BaseModel):
    choice_text: str
    outcome: str
    health_modifier: float
    morale_modifier: float
    relationship_modifier: float

class GameEvent(BaseModel):
    event_id: str
    title: str
    description: str
    choices: List[EventChoice]
    health_impact: float
    morale_impact: float
    relationship_impact: float

# Store game state (in memory for now)
current_game_state: Optional[GameState] = None

@router.post("/game/start")
async def start_game(characters: List[Character]):
    global current_game_state
    
    if len(characters) != 4:
        raise HTTPException(status_code=400, detail="Must select exactly 4 characters")
    
    # Initialize game state
    current_game_state = GameState(
        food=100.0,
        water=100.0,
        morale=100.0,
        health=100.0,
        coins=1000,
        player_characters=characters,
        ai_characters=generate_ai_characters(),
        distance_traveled=0.0
    )
    
    return current_game_state

@router.get("/game/state")
async def get_game_state():
    if not current_game_state:
        raise HTTPException(status_code=404, detail="No active game")
    return current_game_state

@router.post("/game/event")
async def trigger_event():
    if not current_game_state:
        raise HTTPException(status_code=404, detail="No active game")
    
    # Generate random event
    event = generate_random_event()
    return event

@router.post("/game/choice")
async def make_choice(event_id: str, choice_index: int):
    if not current_game_state:
        raise HTTPException(status_code=404, detail="No active game")
    
    # Process choice and update game state
    event = get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    choice = event.choices[choice_index]
    
    # Update game state based on choice
    current_game_state.health += choice.health_modifier
    current_game_state.morale += choice.morale_modifier
    
    # Update relationships
    for character in current_game_state.player_characters:
        for other_char in current_game_state.player_characters + current_game_state.ai_characters:
            if character.character_id != other_char.character_id:
                character.relationships[other_char.character_id] = min(
                    100.0,
                    character.relationships.get(other_char.character_id, 50.0) + choice.relationship_modifier
                )
    
    return {
        "outcome": choice.outcome,
        "game_state": current_game_state
    }

def generate_ai_characters() -> List[Character]:
    ai_characters = []
    for i in range(4):
        character = Character(
            character_id=f"ai_{i}",
            character_name=f"AI Companion {i + 1}",
            background="Generated AI character",
            stats=CharacterStats(
                health=100.0,
                morale=100.0,
                stamina=100.0,
                charisma=random.uniform(30, 70),
                intelligence=random.uniform(30, 70),
                strength=random.uniform(30, 70)
            ),
            traits=CharacterTraits(
                religion=random.choice(["Christian", "Atheist", "Spiritual", "Unknown"]),
                identity=random.choice(["Straight", "Gay", "Bi", "Other"]),
                morality=random.choice(["Lawful", "Neutral", "Chaotic"]),
                skills=random.sample(["Hunting", "Cooking", "Medicine", "Navigation", "Combat"], 2),
                fears=random.sample(["Dark", "Heights", "Water", "Confined Spaces", "Violence"], 2),
                desires=random.sample(["Wealth", "Power", "Love", "Freedom", "Knowledge"], 2)
            ),
            relationships={}
        )
        ai_characters.append(character)
    return ai_characters

def generate_random_event() -> GameEvent:
    events = [
        GameEvent(
            event_id="illness_1",
            title="Fever Strikes",
            description="One of your companions has fallen ill with a fever.",
            choices=[
                EventChoice(
                    choice_text="Use medicine",
                    outcome="The fever breaks, but you've used valuable supplies.",
                    health_modifier=20.0,
                    morale_modifier=5.0,
                    relationship_modifier=10.0
                ),
                EventChoice(
                    choice_text="Let it run its course",
                    outcome="The illness passes naturally, but it was a rough few days.",
                    health_modifier=-10.0,
                    morale_modifier=-15.0,
                    relationship_modifier=-5.0
                )
            ],
            health_impact=-10.0,
            morale_impact=-5.0,
            relationship_impact=0.0
        )
    ]
    return random.choice(events)

def get_event_by_id(event_id: str) -> Optional[GameEvent]:
    # In a real implementation, this would look up the event from a database
    events = [e for e in generate_random_event() if e.event_id == event_id]
    return events[0] if events else None 