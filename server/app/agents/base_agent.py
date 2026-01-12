from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import json
import logging
from app.services.llm import GroqService


# Set up logger for agents
logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Base agent abstraction for all agent implementations.
    
    Provides common functionality:
    - LLM service integration
    - System prompt management
    - Natural language output (markdown/text)
    - Input/output logging
    
    All agents must inherit from this class and implement the _process method.
    
    Attributes:
        llm_service: The Groq LLM service instance
        system_prompt: The system prompt for the agent
        model: The LLM model to use
        temperature: Temperature for LLM responses
    """
    
    def __init__(
        self,
        system_prompt: str,
        llm_service: Optional[GroqService] = None,
        model: str = "llama-3.1-8b-instant",
        temperature: float = 0.7
    ):
        """
        Initialize the base agent.
        
        Args:
            system_prompt: The system prompt that defines the agent's behavior
            llm_service: Optional GroqService instance (creates new one if not provided)
            model: The LLM model to use (default: llama-3.1-8b-instant)
            temperature: Temperature for LLM responses (default: 0.7)
        """
        self.llm_service = llm_service or GroqService()
        self.system_prompt = system_prompt
        self.model = model
        self.temperature = temperature
    
    def _call_llm(self, user_message: str) -> str:
        """
        Call the LLM service with the system prompt and user message.
        
        Args:
            user_message: The user's message/prompt
        
        Returns:
            Raw response from LLM
        
        Raises:
            Exception: If LLM call fails
        """
        return self.llm_service.generate_response(
            user_message=user_message,
            system_message=self.system_prompt,
            model=self.model,
            temperature=self.temperature
        )
    
    @abstractmethod
    def _process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process the input data and return output.
        
        This method must be implemented by subclasses to define
        the specific agent logic.
        
        Args:
            input_data: Input data dictionary
        
        Returns:
            Output data dictionary
        """
        pass
    
    def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the agent with input data.
        
        This is the main entry point for agent execution. It:
        1. Logs the input
        2. Processes the input (calls _process)
        3. Logs the output
        4. Returns output dictionary
        
        Args:
            input_data: Input data dictionary
        
        Returns:
            Output data dictionary
        
        Raises:
            Exception: If processing fails
        """
        # Log input
        logger.info(f"[{self.__class__.__name__}] Input: {json.dumps(input_data, indent=2)}")
        
        try:
            # Process input
            output = self._process(input_data)
            
            # Log output
            logger.info(f"[{self.__class__.__name__}] Output: {json.dumps(output, indent=2)}")
            
            return output
        except Exception as e:
            logger.error(f"[{self.__class__.__name__}] Error: {str(e)}")
            raise

