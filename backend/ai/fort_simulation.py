from typing import List, Dict, Any
import random
from .mission_generator import generate_fort_missions, process_mission_outcome

class FortSimulation:
    def __init__(self, game_state: Dict[str, Any]):
        self.game_state = game_state
        self.current_day = 1
        self.max_days = 3
        self.missions = []
        self.completed_missions = []
        self.fort_data = self._initialize_fort_data()
        
    def _initialize_fort_data(self) -> Dict[str, Any]:
        """Initialize fort data based on game state"""
        # Get fort data from game state or create default
        fort_data = self.game_state.get("current_location", {}).get("fort", {})
        
        if not fort_data:
            # Create default fort data if not available
            fort_data = {
                "name": "Fort Independence",
                "type": "military",
                "description": "A military fort along the Oregon Trail",
                "resources": {
                    "food": 100,
                    "water": 100,
                    "medicine": 50,
                    "ammunition": 75
                },
                "inhabitants": {
                    "soldiers": 20,
                    "civilians": 15,
                    "traders": 5
                },
                "status": {
                    "defense": 70,
                    "morale": 60,
                    "suspicion": 30
                }
            }
            
            # Update game state with fort data
            if "current_location" not in self.game_state:
                self.game_state["current_location"] = {}
            
            self.game_state["current_location"]["fort"] = fort_data
        
        return fort_data
    
    def start_simulation(self) -> Dict[str, Any]:
        """Start the fort simulation"""
        # Reset simulation state
        self.current_day = 1
        self.missions = []
        self.completed_missions = []
        
        # Generate missions for day 1
        self.missions = generate_fort_missions(self.game_state)
        
        return {
            "day": self.current_day,
            "max_days": self.max_days,
            "missions": self.missions,
            "fort_data": self.fort_data
        }
    
    def submit_assignments(self, assignments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Submit character assignments for missions
        
        Args:
            assignments: List of assignments with mission_id and character_id
            
        Returns:
            Day results with mission outcomes
        """
        if self.current_day > self.max_days:
            return {
                "error": "Fort simulation already completed",
                "current_day": self.current_day,
                "max_days": self.max_days
            }
        
        # Process each assignment
        day_results = {
            "day": self.current_day,
            "mission_results": [],
            "fort_status": self.fort_data["status"].copy()
        }
        
        for assignment in assignments:
            mission_id = assignment.get("mission_id")
            character_id = assignment.get("character_id")
            
            # Find mission and character
            mission = next((m for m in self.missions if m["id"] == mission_id), None)
            character = next((c for c in self.game_state.get("characters", []) 
                             if c.get("id") == character_id), None)
            
            if not mission or not character:
                day_results["mission_results"].append({
                    "mission_id": mission_id,
                    "error": "Mission or character not found"
                })
                continue
            
            # Process mission outcome
            outcome = process_mission_outcome(mission, character)
            
            # Update mission with outcome
            mission["status"] = "completed"
            mission["outcome"] = outcome["outcome"]
            mission["outcome_description"] = outcome["description"]
            
            # Apply rewards to character and fort
            self._apply_rewards(character, outcome["rewards"])
            
            # Add to results
            day_results["mission_results"].append({
                "mission_id": mission_id,
                "character_id": character_id,
                "outcome": outcome["outcome"],
                "description": outcome["description"],
                "rewards": outcome["rewards"]
            })
            
            # Add to completed missions
            self.completed_missions.append(mission)
        
        # Remove completed missions
        self.missions = [m for m in self.missions if m["status"] != "completed"]
        
        # Update fort status based on day results
        self._update_fort_status(day_results["mission_results"])
        
        # Move to next day or end simulation
        if self.current_day < self.max_days:
            self.current_day += 1
            # Generate new missions for next day
            self.missions = generate_fort_missions(self.game_state)
            day_results["next_day"] = {
                "day": self.current_day,
                "missions": self.missions
            }
        else:
            # End simulation
            day_results["simulation_complete"] = True
            day_results["summary"] = self._generate_summary()
        
        return day_results
    
    def _apply_rewards(self, character: Dict[str, Any], rewards: Dict[str, Any]):
        """Apply mission rewards to character"""
        # Update character state
        if "state" not in character:
            character["state"] = {}
        
        # Apply resource rewards
        if "resources" in rewards:
            if "resources" not in character["state"]:
                character["state"]["resources"] = 0
            character["state"]["resources"] += rewards["resources"]
        
        # Apply trust rewards
        if "trust" in rewards:
            if "trust" not in character["state"]:
                character["state"]["trust"] = 0
            character["state"]["trust"] += rewards["trust"]
        
        # Apply morale rewards
        if "morale" in rewards:
            if "morale" not in character["state"]:
                character["state"]["morale"] = 50  # Default morale
            character["state"]["morale"] += rewards["morale"]
            # Clamp morale between 0 and 100
            character["state"]["morale"] = max(0, min(100, character["state"]["morale"]))
        
        # Apply suspicion rewards
        if "suspicion" in rewards:
            if "suspicion" not in character["state"]:
                character["state"]["suspicion"] = 0
            character["state"]["suspicion"] += rewards["suspicion"]
            # Clamp suspicion between 0 and 100
            character["state"]["suspicion"] = max(0, min(100, character["state"]["suspicion"]))
    
    def _update_fort_status(self, mission_results: List[Dict[str, Any]]):
        """Update fort status based on mission results"""
        # Calculate overall impact of missions
        total_resources = sum(r.get("rewards", {}).get("resources", 0) for r in mission_results)
        total_morale = sum(r.get("rewards", {}).get("morale", 0) for r in mission_results)
        total_suspicion = sum(r.get("rewards", {}).get("suspicion", 0) for r in mission_results)
        
        # Update fort resources
        self.fort_data["resources"]["food"] += total_resources
        self.fort_data["resources"]["water"] += total_resources
        
        # Update fort status
        self.fort_data["status"]["morale"] += total_morale
        self.fort_data["status"]["suspicion"] += total_suspicion
        
        # Clamp values
        self.fort_data["status"]["morale"] = max(0, min(100, self.fort_data["status"]["morale"]))
        self.fort_data["status"]["suspicion"] = max(0, min(100, self.fort_data["status"]["suspicion"]))
        
        # Update defense based on morale
        if self.fort_data["status"]["morale"] > 70:
            self.fort_data["status"]["defense"] += 5
        elif self.fort_data["status"]["morale"] < 30:
            self.fort_data["status"]["defense"] -= 5
        
        # Clamp defense
        self.fort_data["status"]["defense"] = max(0, min(100, self.fort_data["status"]["defense"]))
    
    def _generate_summary(self) -> Dict[str, Any]:
        """Generate a summary of the fort simulation"""
        # Calculate success rate
        total_missions = len(self.completed_missions)
        successful_missions = sum(1 for m in self.completed_missions if m["outcome"] == "success")
        partial_success_missions = sum(1 for m in self.completed_missions if m["outcome"] == "partial_success")
        failed_missions = sum(1 for m in self.completed_missions if m["outcome"] == "failure")
        
        success_rate = successful_missions / total_missions if total_missions > 0 else 0
        
        # Calculate resource changes
        initial_resources = 100  # Default starting resources
        final_resources = self.fort_data["resources"]["food"] + self.fort_data["resources"]["water"]
        resource_change = final_resources - (initial_resources * 2)  # *2 because food and water
        
        # Generate summary text
        summary_text = f"""
        Fort Simulation Summary:
        
        You completed {total_missions} missions over {self.max_days} days.
        - Successful: {successful_missions}
        - Partially Successful: {partial_success_missions}
        - Failed: {failed_missions}
        
        Overall success rate: {success_rate:.0%}
        
        Fort Status:
        - Defense: {self.fort_data['status']['defense']}/100
        - Morale: {self.fort_data['status']['morale']}/100
        - Suspicion: {self.fort_data['status']['suspicion']}/100
        
        Resource Change: {resource_change:+d}
        """
        
        return {
            "total_missions": total_missions,
            "successful_missions": successful_missions,
            "partial_success_missions": partial_success_missions,
            "failed_missions": failed_missions,
            "success_rate": success_rate,
            "fort_status": self.fort_data["status"],
            "resource_change": resource_change,
            "summary_text": summary_text
        } 