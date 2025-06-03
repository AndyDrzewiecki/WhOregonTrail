from pydantic import BaseModel
from typing import List, Dict, Optional
import random

class CharacterStats(BaseModel):
    health: float = 100.0
    morale: float = 100.0
    stamina: float = 100.0
    charisma: float = 50.0
    intelligence: float = 50.0
    strength: float = 50.0

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
    relationships: Dict[str, float] = {}

    @classmethod
    def generate_random(cls, character_id: str, character_name: str) -> "Character":
        """Generate a random character with randomized stats and traits."""
        return cls(
            character_id=character_id,
            character_name=character_name,
            background="A generated character with a mysterious past.",
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

    def update_stats(self, health_delta: float = 0, morale_delta: float = 0, stamina_delta: float = 0):
        """Update character stats with the given deltas."""
        self.stats.health = max(0, min(100, self.stats.health + health_delta))
        self.stats.morale = max(0, min(100, self.stats.morale + morale_delta))
        self.stats.stamina = max(0, min(100, self.stats.stamina + stamina_delta))

    def update_relationship(self, target_id: str, delta: float):
        """Update relationship with another character."""
        current = self.relationships.get(target_id, 50.0)
        self.relationships[target_id] = max(0, min(100, current + delta))

    def get_relationship(self, target_id: str) -> float:
        """Get relationship value with another character."""
        return self.relationships.get(target_id, 50.0)

    def is_alive(self) -> bool:
        """Check if character is alive based on health."""
        return self.stats.health > 0

    def is_healthy(self) -> bool:
        """Check if character is healthy based on stats."""
        return (self.stats.health > 70 and 
                self.stats.morale > 50 and 
                self.stats.stamina > 50)

    def get_skill_level(self, skill: str) -> float:
        """Get character's level in a specific skill."""
        if skill in self.traits.skills:
            return random.uniform(60, 100)
        return random.uniform(20, 40)

    def get_fear_level(self, fear: str) -> float:
        """Get character's level of fear for a specific thing."""
        if fear in self.traits.fears:
            return random.uniform(70, 100)
        return random.uniform(0, 30)

    def get_desire_strength(self, desire: str) -> float:
        """Get character's strength of desire for a specific thing."""
        if desire in self.traits.desires:
            return random.uniform(70, 100)
        return random.uniform(0, 30) 