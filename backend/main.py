from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import openai
import os
from dotenv import load_dotenv
from ai.fort_simulation import FortSimulation

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

class VoiceInput(BaseModel):
    audio_data: str  # Base64 encoded audio data

class CharacterResponse(BaseModel):
    character_id: str
    context: str
    previous_responses: Optional[List[str]] = None

class Interaction(BaseModel):
    character1_id: str
    character2_id: str
    context: str
    previous_interactions: Optional[List[str]] = None

class MissionOptions(BaseModel):
    current_mission: str
    player_choices: List[str]
    game_state: dict

class FortSimulationRequest(BaseModel):
    game_state: Dict[str, Any]
    action: str  # "start" or "submit"
    assignments: Optional[List[Dict[str, Any]]] = None

# Store active fort simulations
active_simulations = {}

@app.post("/process_voice")
async def process_voice(input_data: VoiceInput):
    try:
        # Here you would implement the actual voice processing
        # For now, we'll return a mock response
        return {"text": "Processed voice input"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_response")
async def generate_response(request: CharacterResponse):
    try:
        # Generate response using OpenAI
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": f"You are character {request.character_id}"},
                {"role": "user", "content": request.context}
            ]
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process_interaction")
async def process_interaction(request: Interaction):
    try:
        # Generate interaction response using OpenAI
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": f"Generate an interaction between {request.character1_id} and {request.character2_id}"},
                {"role": "user", "content": request.context}
            ]
        )
        return {"interaction": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_missions")
async def generate_missions(request: MissionOptions):
    try:
        # Generate mission options using OpenAI
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Generate mission options based on the current game state"},
                {"role": "user", "content": f"Current mission: {request.current_mission}\nPlayer choices: {request.player_choices}\nGame state: {request.game_state}"}
            ]
        )
        return {"options": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fort/day")
async def fort_simulation(request: FortSimulationRequest):
    try:
        # Get or create simulation ID
        simulation_id = request.game_state.get("simulation_id", "default")
        
        if request.action == "start":
            # Start a new fort simulation
            simulation = FortSimulation(request.game_state)
            active_simulations[simulation_id] = simulation
            result = simulation.start_simulation()
            
            # Update game state with simulation ID
            request.game_state["simulation_id"] = simulation_id
            
            return {
                "simulation_id": simulation_id,
                "result": result
            }
            
        elif request.action == "submit":
            # Submit assignments for the current day
            if simulation_id not in active_simulations:
                raise HTTPException(status_code=400, detail="No active fort simulation found")
                
            simulation = active_simulations[simulation_id]
            
            if not request.assignments:
                raise HTTPException(status_code=400, detail="No assignments provided")
                
            result = simulation.submit_assignments(request.assignments)
            
            # If simulation is complete, remove it from active simulations
            if result.get("simulation_complete", False):
                del active_simulations[simulation_id]
                
            return {
                "simulation_id": simulation_id,
                "result": result
            }
            
        else:
            raise HTTPException(status_code=400, detail="Invalid action. Use 'start' or 'submit'")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 