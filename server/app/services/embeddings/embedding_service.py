from openai import OpenAI
from typing import List
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class EmbeddingService:
    """
    Service for generating text embeddings.
    
    This service provides a clean interface for generating embeddings from text.
    Uses OpenAI's embeddings API for generation.
    
    Attributes:
        client: OpenAI client for embedding generation
        model: The embedding model to use
        dimension: The dimension of embeddings produced by the model
    """
    
    # Model dimension mapping
    MODEL_DIMENSIONS = {
        "text-embedding-3-small": 1536,
    }
    
    def __init__(self, model: str = "text-embedding-3-small"):
        """
        Initialize the embedding service.
        
        Args:
            model: The embedding model to use (default: text-embedding-3-small)
        
        Raises:
            ValueError: If OPENAI_API_KEY environment variable is not set
        """
        api_key = os.environ.get("OPENAI_API_KEY")
        
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        
        self.client = OpenAI(api_key=api_key)
        self.model = model
        self.dimension = self.MODEL_DIMENSIONS.get(model, 1536)
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts.
        
        Args:
            texts: List of text strings to embed
        
        Returns:
            List of embedding vectors, each as a list of floats
        
        Raises:
            ValueError: If texts list is empty
            Exception: If embedding generation fails
        """
        if not texts:
            raise ValueError("Cannot generate embeddings for empty text list")
        
        try:
            response = self.client.embeddings.create(
                model=self.model,
                input=texts
            )
            
            # Extract embeddings from response
            embeddings = [item.embedding for item in response.data]
            return embeddings
        except Exception as e:
            raise Exception(f"Error generating embeddings: {str(e)}") from e
    
    def get_dimension(self) -> int:
        """
        Get the dimension of embeddings produced by this service.
        
        Returns:
            Embedding dimension
        """
        return self.dimension

