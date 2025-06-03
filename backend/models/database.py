from sqlalchemy import create_engine, Column, Integer, String, Float, JSON, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime
import json

Base = declarative_base()

class GameState(Base):
    __tablename__ = 'game_states'
    
    id = Column(Integer, primary_key=True)
    save_name = Column(String, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_modified = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    game_data = Column(JSON)
    characters = relationship("Character", back_populates="game_state")
    relationships = relationship("Relationship", back_populates="game_state")
    inventory = relationship("Inventory", back_populates="game_state")
    missions = relationship("Mission", back_populates="game_state")

class Character(Base):
    __tablename__ = 'characters'
    
    id = Column(Integer, primary_key=True)
    game_state_id = Column(Integer, ForeignKey('game_states.id'))
    character_id = Column(String)  # Unique identifier for the character
    name = Column(String)
    attributes = Column(JSON)  # Stores all character attributes
    skills = Column(JSON)  # Stores all skills and abilities
    state = Column(JSON)  # Current state (health, mood, etc.)
    game_state = relationship("GameState", back_populates="characters")
    relationships = relationship("Relationship", back_populates="character")

class Relationship(Base):
    __tablename__ = 'relationships'
    
    id = Column(Integer, primary_key=True)
    game_state_id = Column(Integer, ForeignKey('game_states.id'))
    character_id = Column(Integer, ForeignKey('characters.id'))
    target_character_id = Column(Integer, ForeignKey('characters.id'))
    relationship_type = Column(JSON)  # Stores all relationship attributes
    interaction_history = Column(JSON)  # Stores interaction history
    game_state = relationship("GameState", back_populates="relationships")
    character = relationship("Character", back_populates="relationships")

class Inventory(Base):
    __tablename__ = 'inventories'
    
    id = Column(Integer, primary_key=True)
    game_state_id = Column(Integer, ForeignKey('game_states.id'))
    items = Column(JSON)  # Stores all inventory items
    resources = Column(JSON)  # Stores resources (food, water, etc.)
    money = Column(Float)
    game_state = relationship("GameState", back_populates="inventory")

class Mission(Base):
    __tablename__ = 'missions'
    
    id = Column(Integer, primary_key=True)
    game_state_id = Column(Integer, ForeignKey('game_states.id'))
    mission_type = Column(String)
    status = Column(String)
    progress = Column(JSON)
    rewards = Column(JSON)
    game_state = relationship("GameState", back_populates="missions")

class DatabaseManager:
    def __init__(self, db_path: str):
        self.engine = create_engine(f'sqlite:///{db_path}')
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)

    def create_save(self, save_name: str, game_data: dict) -> int:
        session = self.Session()
        try:
            game_state = GameState(
                save_name=save_name,
                game_data=game_data
            )
            session.add(game_state)
            session.commit()
            return game_state.id
        finally:
            session.close()

    def load_save(self, save_name: str) -> dict:
        session = self.Session()
        try:
            game_state = session.query(GameState).filter_by(save_name=save_name).first()
            if game_state:
                return {
                    'game_data': game_state.game_data,
                    'characters': [self._character_to_dict(c) for c in game_state.characters],
                    'relationships': [self._relationship_to_dict(r) for r in game_state.relationships],
                    'inventory': [self._inventory_to_dict(i) for i in game_state.inventory],
                    'missions': [self._mission_to_dict(m) for m in game_state.missions]
                }
            return None
        finally:
            session.close()

    def update_save(self, save_name: str, game_data: dict):
        session = self.Session()
        try:
            game_state = session.query(GameState).filter_by(save_name=save_name).first()
            if game_state:
                game_state.game_data = game_data
                game_state.last_modified = datetime.utcnow()
                session.commit()
        finally:
            session.close()

    def _character_to_dict(self, character: Character) -> dict:
        return {
            'id': character.character_id,
            'name': character.name,
            'attributes': character.attributes,
            'skills': character.skills,
            'state': character.state
        }

    def _relationship_to_dict(self, relationship: Relationship) -> dict:
        return {
            'character_id': relationship.character_id,
            'target_character_id': relationship.target_character_id,
            'relationship_type': relationship.relationship_type,
            'interaction_history': relationship.interaction_history
        }

    def _inventory_to_dict(self, inventory: Inventory) -> dict:
        return {
            'items': inventory.items,
            'resources': inventory.resources,
            'money': inventory.money
        }

    def _mission_to_dict(self, mission: Mission) -> dict:
        return {
            'type': mission.mission_type,
            'status': mission.status,
            'progress': mission.progress,
            'rewards': mission.rewards
        } 