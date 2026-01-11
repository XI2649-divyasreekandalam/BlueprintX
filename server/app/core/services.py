from app.services.vectorstores import FAISSVectorStore
from app.services.embeddings import EmbeddingService
from app.services.llm import GroqService
from app.agents import (
    DocumentUnderstandingAgent,
    UseCaseDiscoveryAgent,
    SolutionArchitectureAgent,
    GovernanceAgent,
    BlueprintSynthesizerAgent,
    Orchestrator,
    OrchestratorStep
)
from app.services.ingestion import IngestionPipeline
from typing import List


# Initialize shared services
embedding_service = EmbeddingService(model="text-embedding-3-small")
vector_store = FAISSVectorStore(dimension=embedding_service.get_dimension())
ingestion_pipeline = IngestionPipeline(
    vector_store=vector_store,
    embedding_service=embedding_service
)

# Initialize Agents
understanding_agent = DocumentUnderstandingAgent(
    vector_store=vector_store,
    embedding_service=embedding_service
)
discovery_agent = UseCaseDiscoveryAgent()
architecture_agent = SolutionArchitectureAgent()
governance_agent = GovernanceAgent()
synthesizer_agent = BlueprintSynthesizerAgent()

# Define Orchestrator Flow
def create_blueprint_orchestrator() -> Orchestrator:
    """
    Creates and configures the blueprint generation orchestrator.
    
    The flow is: Understanding -> Discovery -> Architecture -> Governance -> Synthesis
    """
    
    # Custom failure handler example
    def default_failure_handler(input_data, error):
        return {"status": "FAILED", "error": str(error)}

    steps = [
        OrchestratorStep(
            name="understand",
            agent=understanding_agent,
            retries=1
        ),
        OrchestratorStep(
            name="discover",
            agent=discovery_agent,
            retries=1
        ),
        OrchestratorStep(
            name="architect",
            agent=architecture_agent,
            retries=1
        ),
        OrchestratorStep(
            name="govern",
            agent=governance_agent,
            retries=1
        ),
        OrchestratorStep(
            name="synthesize",
            agent=synthesizer_agent,
            retries=1
        )
    ]
    
    return Orchestrator(steps)

# Global orchestrator instance
blueprint_orchestrator = create_blueprint_orchestrator()

