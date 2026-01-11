from typing import Dict, Any, List
import logging
from app.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

USE_CASE_DISCOVERY_SYSTEM_PROMPT = """
You are a Senior Strategic GenAI Architect. Your objective is to identify, prioritize, and define high-impact Generative AI use cases based on the provided Current State Assessment.

### Your Tasks:
1. **Propose GenAI Initiatives**: Identify at least 3 distinct Generative AI opportunities (e.g., RAG-based knowledge assistants, automated content generation, agentic workflow automation, or code synthesis).
2. **Define Success Metrics (KPIs)**: For each use case, define specific business KPIs (e.g., reduction in support ticket volume, % improvement in search accuracy, hours of manual work saved).
3. **Define R&D & Experimentation Metrics**: Define technical metrics for the R&D phase (e.g., Retrieval Precision/Recall, Faithfulness, Answer Relevance, Latency/Cost per 1k tokens).
4. **Strategic Recommendation**: Select exactly one GenAI initiative as the primary recommendation for the SOW.
5. **Tradeoff & Feasibility Analysis**: Explain why this use case was selected, highlighting the balance between business value, technical feasibility (RAG complexity vs. fine-tuning), and data readiness.

### STRICT RULES:
- Your analysis must be purely grounded in the provided Current State Assessment.
- All proposed solutions must be specifically Generative AI focused.
- OUTPUT FORMAT: Provide a professional markdown section titled "GenAI Strategic Roadmap and Recommended Initiative". Include a dedicated table or section for "KPIs and R&D Success Metrics".
"""

class UseCaseDiscoveryAgent(BaseAgent):
    """
    Agent for discovering and prioritizing AI use cases.
    
    Analyzes the current state assessment to propose AI opportunities, 
    analyze them, and recommend the best option with tradeoff analysis
    in a professional markdown format.
    """
    
    def __init__(
        self,
        model: str = "llama-3.1-8b-instant",
        temperature: float = 0.2  # Low temperature for analytical consistency
    ):
        """
        Initialize the Use Case Discovery Agent.
        
        Args:
            model: LLM model to use
            temperature: Sampling temperature
        """
        super().__init__(
            system_prompt=USE_CASE_DISCOVERY_SYSTEM_PROMPT,
            model=model,
            temperature=temperature
        )

    def _process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process the use case discovery request.
        
        Expected input_data:
        - Direct: {"content": "..."}
        - Orchestrated: {"understand": {"content": "..."}}
        
        Returns:
            Dictionary containing the 'content' as markdown text.
        """
        # Support both direct input and orchestrated input
        context_data = input_data.get("understand", input_data)
        current_state = context_data.get("content", "No current state assessment provided.")

        # Build user message
        user_message = f"""
        ### CURRENT STATE ASSESSMENT:
        {current_state}
        
        Based on this assessment, propose several AI use cases and provide a final strategic recommendation for the Statement of Work.
        """
        
        # Call LLM
        response = self._call_llm(user_message)
        
        return {"content": response}
