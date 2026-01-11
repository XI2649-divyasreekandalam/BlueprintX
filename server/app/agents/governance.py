from typing import Dict, Any, List
import logging
from app.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

GOVERNANCE_SYSTEM_PROMPT = """
You are a Senior GenAI Governance & Risk Officer. Your responsibility is to audit the proposed GenAI solution for compliance, safety, and operational risk.

### Your Objectives:
1. **GenAI Risk Audit**: Identify risks specific to Generative AI, including hallucinations, bias, prompt injection, data leakage, and copyright concerns.
2. **Safety & Alignment Metrics**: Define the required metrics for safety testing (e.g., Toxicity scores, Jailbreak success rates, Grounding scores).
3. **Compliance Mapping**: Map the architecture against regulatory requirements (e.g., EU AI Act, HIPAA, GDPR) as they apply to LLM usage.
4. **Mitigation & Guardrail Requirements**: Specify the technical guardrails (e.g., Llama Guard, NeMo Guardrails) required for approval.
5. **Final Approval Status**: Provide a clear status: APPROVED, APPROVED_WITH_CONDITIONS, or REJECTED.

### STRICT GOVERNANCE RULES:
- **Zero-Tolerance for Hallucination**: You may ONLY reference constraints found in the provided context.
- **Evidence-Based Reasoning**: Cite specific GenAI risks related to the proposed data flow.
- OUTPUT FORMAT: Provide a professional markdown section titled "GenAI Governance, Safety, and Risk Compliance Audit".
"""

class GovernanceAgent(BaseAgent):
    """
    Agent for validating solution architectures against regulatory and business constraints.
    
    Ensures that proposed AI designs adhere to the documented limits and 
    requirements identified in the source materials, producing a detailed 
    audit in markdown format.
    """
    
    def __init__(
        self,
        model: str = "llama-3.1-8b-instant",
        temperature: float = 0.0  # Zero temperature for strictness
    ):
        """
        Initialize the Governance Agent.
        
        Args:
            model: LLM model to use
            temperature: Sampling temperature
        """
        super().__init__(
            system_prompt=GOVERNANCE_SYSTEM_PROMPT,
            model=model,
            temperature=temperature
        )

    def _process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process the governance validation request.
        
        Expected input_data:
        - Direct: {"understand": {...}, "architect": {...}}
        - Orchestrated: {"understand": {...}, "architect": {...}}
        
        Returns:
            Dictionary containing the 'content' as markdown text.
        """
        # Support both direct input and orchestrated input
        current_state_data = input_data.get("understand", {})
        architecture_data = input_data.get("architect", {})

        current_state = current_state_data.get("content", "No current state assessment provided.")
        architecture = architecture_data.get("content", "No solution architecture provided.")

        # Build user message for audit
        user_message = f"""
        ### CURRENT STATE ASSESSMENT & CONSTRAINTS:
        {current_state}
        
        ### PROPOSED SOLUTION ARCHITECTURE:
        {architecture}
        
        Perform a strict governance audit for the Statement of Work. Validate the architecture and provide a risk assessment.
        """
        
        # Call LLM
        response = self._call_llm(user_message)
        
        return {"content": response}
