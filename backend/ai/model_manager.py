from typing import Dict, List, Optional
import openai
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from .whisper_manager import WhisperManager
from .character_ai import CharacterAIManager
from ..config import Settings
from ..models.interaction import Interaction, Response

class ModelManager:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.whisper = WhisperManager()
        self.character_ai = CharacterAIManager(settings)
        self.openai_client = openai.OpenAI(api_key=settings.openai_api_key)
        
        # Initialize local models
        self.llama_model = None
        self.llama_tokenizer = None
        self._load_local_models()

    def _load_local_models(self):
        """Load local models for offline processing"""
        try:
            self.llama_tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b-chat-hf")
            self.llama_model = AutoModelForCausalLM.from_pretrained(
                "meta-llama/Llama-2-7b-chat-hf",
                torch_dtype=torch.float16,
                device_map="auto"
            )
        except Exception as e:
            print(f"Failed to load local models: {e}")

    async def process_interaction(self, interaction: Interaction) -> Response:
        """
        Process an interaction using the most appropriate model based on context
        """
        # Determine which model to use based on interaction complexity
        model_choice = self._select_model(interaction)
        
        if model_choice == "gpt4":
            return await self._process_gpt4(interaction)
        elif model_choice == "llama":
            return await self._process_llama(interaction)
        else:
            return await self._process_character_ai(interaction)

    def _select_model(self, interaction: Interaction) -> str:
        """
        Select the most appropriate model based on interaction context
        """
        # Complex emotional or moral decisions use GPT-4
        if interaction.complexity_score > 8 or interaction.requires_moral_judgment:
            return "gpt4"
        
        # Simple interactions use local LLaMA
        if interaction.complexity_score < 4 and self.llama_model is not None:
            return "llama"
        
        # Personality-focused interactions use Character.ai
        if interaction.focus_on_personality:
            return "character_ai"
        
        # Default to GPT-4
        return "gpt4"

    async def _process_gpt4(self, interaction: Interaction) -> Response:
        """Process interaction using GPT-4"""
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": interaction.system_prompt},
                    {"role": "user", "content": interaction.user_input}
                ],
                temperature=interaction.temperature,
                max_tokens=interaction.max_tokens
            )
            return Response(
                text=response.choices[0].message.content,
                model_used="gpt4",
                confidence_score=0.95
            )
        except Exception as e:
            print(f"GPT-4 processing error: {e}")
            return await self._process_llama(interaction)

    async def _process_llama(self, interaction: Interaction) -> Response:
        """Process interaction using local LLaMA model"""
        if self.llama_model is None:
            return await self._process_character_ai(interaction)
            
        try:
            inputs = self.llama_tokenizer(interaction.user_input, return_tensors="pt")
            outputs = self.llama_model.generate(
                **inputs,
                max_length=interaction.max_tokens,
                temperature=interaction.temperature
            )
            response_text = self.llama_tokenizer.decode(outputs[0])
            return Response(
                text=response_text,
                model_used="llama",
                confidence_score=0.85
            )
        except Exception as e:
            print(f"LLaMA processing error: {e}")
            return await self._process_character_ai(interaction)

    async def process_voice_input(self, audio_data: bytes) -> str:
        """Process voice input using Whisper"""
        return await self.whisper.transcribe(audio_data)

    async def generate_character_response(
        self,
        character_id: str,
        context: Dict,
        user_input: str
    ) -> Response:
        """Generate a character-specific response"""
        interaction = Interaction(
            character_id=character_id,
            context=context,
            user_input=user_input,
            complexity_score=5,  # Default complexity
            focus_on_personality=True
        )
        return await self.process_interaction(interaction) 