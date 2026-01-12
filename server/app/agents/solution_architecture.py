from typing import Dict, Any, List
import logging
from app.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

SOLUTION_ARCHITECTURE_SYSTEM_PROMPT = """
You are a Lead GenAI Solution Architect. Your task is to design a robust, scalable, and enterprise-ready Generative AI architecture for the recommended initiative.

### Your Design Requirements:
1. **GenAI Stack Selection**: Specify LLMs (e.g., Llama 3, GPT-4, specialized models via Groq), Embedding models, and Vector Databases (e.g., FAISS, Pinecone, Weaviate).
2. **Technical Pipeline**: Detail the RAG (Retrieval-Augmented Generation) pipeline or Agentic workflow, including orchestration layers (e.g., LangChain, LlamaIndex).
3. **Inference & R&D Metrics**: Specify target technical KPIs such as TTFT (Time To First Token), TPOT (Time Per Output Token), and context window management strategy.
4. **Data Privacy & Guardrails**: Design for PII redaction, prompt injection protection, and output hallucination filters.
5. **Architecture Diagram**: Provide a textual architecture diagram using Mermaid syntax (flowchart TD) showing the end-to-end GenAI data flow.

### STRICT RULES:
- Design MUST be grounded in the provided current state and recommended GenAI initiative.
- Use Mermaid syntax for the diagram.
- Focus on practical, deployable GenAI patterns.
- OUTPUT FORMAT: Provide a professional markdown section titled "GenAI Technical Architecture and Implementation Design".
"""

class SolutionArchitectureAgent(BaseAgent):
    """
    Agent for designing enterprise AI solution architectures.
    
    Translates a selected AI use case and current state assessment into a 
    detailed system design, including model selection, data flows, 
    deployment strategies, and technical diagrams in markdown format.
    """
    
    def __init__(
        self,
        model: str = "llama-3.1-8b-instant",
        temperature: float = 0.2
    ):
        """
        Initialize the Solution Architecture Agent.
        
        Args:
            model: LLM model to use
            temperature: Sampling temperature
        """
        super().__init__(
            system_prompt=SOLUTION_ARCHITECTURE_SYSTEM_PROMPT,
            model=model,
            temperature=temperature
        )

    def _process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process the solution architecture request.
        
        Expected input_data:
        - Direct: {"understand": {"content": "..."}, "discover": {"content": "..."}}
        - Orchestrated: {"understand": {...}, "discover": {...}}
        
        Returns:
            Dictionary containing the 'content' as markdown text.
        """
        # Support both direct input and orchestrated input
        current_state_data = input_data.get("understand", {})
        recommendation_data = input_data.get("discover", {})

        current_state = current_state_data.get("content", "No current state assessment provided.")
        recommendation = recommendation_data.get("content", "No strategic recommendation provided.")

        # Build user message
        user_message = f"""
        ### CURRENT STATE ASSESSMENT:
        {current_state}
        
        ### STRATEGIC RECOMMENDATION:
        {recommendation}
        
        Design a complete enterprise AI solution architecture based on this information for the Statement of Work.
        """
        
        # Call LLM
        response = self._call_llm(user_message)
        
        return {"content": response}
