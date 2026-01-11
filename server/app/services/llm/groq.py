from openai import OpenAI
import os
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class GroqService:
    """
    Service for interacting with Groq's LLM API.
    
    This class provides a clean interface for making raw LLM calls to Groq's API.
    It follows the single responsibility principle by only handling LLM interactions
    and not containing any business logic.
    
    Attributes:
        client: OpenAI client configured for Groq API
    """
    
    def __init__(self) -> None:
        """
        Initialize the Groq service client.
        
        Raises:
            ValueError: If GROQ_API_KEY environment variable is not set
        """
        api_key = os.environ.get("GROQ_API_KEY")
        
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set")
        
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
        )
    
    def generate_response(
        self,
        user_message: str,
        system_message: Optional[str] = None,
        model: str = "llama-3.1-8b-instant",
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Generate a response from the Groq LLM.
        
        This method makes a raw API call to Groq's LLM and returns the generated text.
        It supports system and user messages, with optional temperature and max_tokens.
        
        Args:
            user_message: The user's input prompt/question
            system_message: Optional system message to set the assistant's behavior
            model: The model to use (default: llama-3.1-8b-instant)
            temperature: Optional sampling temperature (0.0 to 2.0)
            max_tokens: Optional maximum number of tokens to generate
        
        Returns:
            The generated response text from the LLM
        
        Raises:
            Exception: If the API call fails or returns an invalid response
        """
        messages: List[Dict[str, str]] = []
        
        if system_message:
            messages.append({
                "role": "system",
                "content": system_message
            })
        
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        request_params: Dict[str, Any] = {
            "model": model,
            "messages": messages,
        }
        
        if temperature is not None:
            request_params["temperature"] = temperature
        
        if max_tokens is not None:
            request_params["max_tokens"] = max_tokens
        
        response = self.client.chat.completions.create(**request_params)
        
        if not response.choices or not response.choices[0].message.content:
            raise ValueError("Invalid response from Groq API: empty content")
        
        return response.choices[0].message.content
