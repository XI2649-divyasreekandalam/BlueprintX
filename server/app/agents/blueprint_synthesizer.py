from typing import Dict, Any, List
import logging
from app.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

BLUEPRINT_SYNTHESIZER_SYSTEM_PROMPT = """
You are a Lead GenAI Solutions Strategist. Your final task is to synthesize the specialized agent outputs into a definitive, professional **Statement of Work (SOW) for a Generative AI Implementation**.

### Your Objectives:
1. **Strategic Consolidation**: Merge the Current State, Strategic Roadmap, Architecture, and Governance into a single, high-impact SOW.
2. **Executive Summary**: Draft a compelling executive summary that emphasizes the ROI and transformative potential of the recommended GenAI solution.
3. **KPI & R&D Alignment**: Ensure the business KPIs and technical R&D metrics are prominently featured and aligned across all sections.
4. **Professional SOW Formatting**: Ensure the document uses authoritative consulting language, maintains logical flow, and is ready for formal presentation.

### SOW Structure:
1. **Executive Summary: GenAI Strategic Vision**
2. **GenAI Readiness & Current State Assessment** (from Understanding)
3. **GenAI Strategic Roadmap and Recommended Initiative** (including KPIs & R&D Metrics) (from Discovery)
4. **GenAI Technical Architecture and Implementation Design** (from Architecture)
5. **GenAI Governance, Safety, and Risk Compliance Audit** (from Governance)

### STRICT RULES:
- The document must be 100% focused on Generative AI.
- Ensure all technical Mermaid diagrams and metric tables are correctly preserved and integrated.
- OUTPUT FORMAT: Provide the complete Statement of Work in high-quality markdown format.
"""

class BlueprintSynthesizerAgent(BaseAgent):
    """
    Agent for synthesizing the final Proposal Statement of Work (SOW).
    
    Merges outputs from all previous agents, resolves inconsistencies,
    and produces a polished, executive-ready SOW in markdown format.
    """
    
    def __init__(
        self,
        model: str = "llama-3.1-8b-instant",
        temperature: float = 0.3
    ):
        """
        Initialize the Blueprint Synthesizer Agent.
        
        Args:
            model: LLM model to use
            temperature: Sampling temperature
        """
        super().__init__(
            system_prompt=BLUEPRINT_SYNTHESIZER_SYSTEM_PROMPT,
            model=model,
            temperature=temperature
        )

    def _process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process the blueprint synthesis request.
        
        Expected input_data (Aggregated from all previous agents):
        - Orchestrated: {"understand": {...}, "discover": {...}, "architect": {...}, "govern": {...}}
        
        Returns:
            Dictionary containing the 'content' as markdown text (the final SOW).
        """
        # Support both direct input and orchestrated input
        understanding = input_data.get("understand", {}).get("content", "N/A")
        discovery = input_data.get("discover", {}).get("content", "N/A")
        architecture = input_data.get("architect", {}).get("content", "N/A")
        governance = input_data.get("govern", {}).get("content", "N/A")

        # Build user message for synthesis
        user_message = f"""
        Synthesize the following sections into a final Proposal Statement of Work (SOW) for a GenAI Implementation.
        
        ### Formatting Instructions:
        1. Use **bold** for emphasis.
        2. Use # for main headers and ## for subheaders.
        3. Use bullet points for lists.
        4. Ensure logical flow and a professional consulting tone.
        5. DO NOT use other markdown features like tables or code blocks unless absolutely necessary for the Mermaid diagram.

        ### CURRENT STATE ASSESSMENT:
        {understanding}

        ### STRATEGIC RECOMMENDATION:
        {discovery}

        ### TECHNICAL DESIGN:
        {architecture}

        ### GOVERNANCE & RISK:
        {governance}
        
        Produce the final synthesized Proposal SOW.
        """
        
        # Call LLM
        response = self._call_llm(user_message)
        
        return {"content": response}
