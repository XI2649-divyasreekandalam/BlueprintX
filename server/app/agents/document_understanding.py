from typing import Dict, Any, List
import logging
from app.agents.base_agent import BaseAgent
from app.services.vectorstores import FAISSVectorStore
from app.services.embeddings import EmbeddingService

logger = logging.getLogger(__name__)

DOCUMENT_UNDERSTANDING_SYSTEM_PROMPT = """
You are a Senior Enterprise GenAI Consultant. Your goal is to extract and summarize critical business and technical information from the provided document context to lay the foundation for a Generative AI initiative.

### Extraction Targets for GenAI Readiness:
1. **Business Goals & GenAI Value Drivers**: What is the organization trying to achieve, specifically through automation, content generation, or knowledge synthesis?
2. **Systems & Unstructured Data Assets**: Identify software systems and, crucially, unstructured data sources (PDFs, docs, wikis, databases) that can be leveraged for LLM training or RAG.
3. **Existing KPIs & Baseline Metrics**: Extract any mentioned performance indicators, operational costs, or manual effort metrics that a GenAI solution could improve.
4. **Technical & Regulatory Constraints**: Identify limitations, security requirements (PII, data residency), or regulatory hurdles specific to AI and data usage.

### STRICT GROUNDING RULES:
- ONLY use information explicitly stated in the provided context.
- NEVER invent information. If an extraction target is not mentioned, explicitly state that it was not found.
- Maintain absolute technical accuracy regarding data formats and system integration points.

### OUTPUT FORMAT:
Provide a clear, professional markdown summary. Use headers: "GenAI Readiness & Current State Assessment". Include a specific subsection for "Available Baseline Metrics & KPIs" if found. This output will be the foundational section of a Statement of Work (SOW).
"""

class DocumentUnderstandingAgent(BaseAgent):
    """
    Agent for extracting business architecture information from documents.
    
    Retrieves relevant chunks from a vector store and extracts information
    about business goals, systems, data assets, and constraints in a professional
    markdown format.
    """
    
    def __init__(
        self,
        vector_store: FAISSVectorStore,
        embedding_service: EmbeddingService,
        model: str = "llama-3.1-8b-instant",
        temperature: float = 0.1  # Low temperature for extraction accuracy
    ):
        """
        Initialize the Document Understanding Agent.
        
        Args:
            vector_store: FAISS vector store for retrieval
            embedding_service: Service for generating query embeddings
            model: LLM model to use
            temperature: Sampling temperature
        """
        super().__init__(
            system_prompt=DOCUMENT_UNDERSTANDING_SYSTEM_PROMPT,
            model=model,
            temperature=temperature
        )
        self.vector_store = vector_store
        self.embedding_service = embedding_service

    def _process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process the document understanding request.
        
        Expected input_data:
        - "query": The focus of the extraction (default: "business architecture")
        - "k": Number of chunks to retrieve (default: 5)
        
        Returns:
            Dictionary containing the 'content' as markdown text.
        """
        query = input_data.get("query", "What are the business goals, systems, data assets, and constraints mentioned in this document?")
        k = input_data.get("k", 5)
        
        # 1. Retrieve relevant chunks
        logger.info(f"Retrieving {k} chunks for query: {query}")
        query_embedding = self.embedding_service.generate_embeddings([query])[0]
        results = self.vector_store.similarity_search(query_embedding, k=k)
        
        # 2. Format context from chunks
        context_parts = []
        for i, res in enumerate(results):
            text = res["metadata"].get("text", "")
            context_parts.append(f"--- Context Chunk {i+1} ---\n{text}")
        
        context = "\n\n".join(context_parts)
        
        if not context:
            return {
                "content": "No relevant context found in the uploaded documents to perform a business architecture assessment.",
                "warning": "No relevant context found in vector store."
            }
        
        # 3. Build the prompt for the LLM
        user_message = f"DOCUMENT CONTEXT:\n\n{context}\n\nBased on the above context, provide a comprehensive Current State Assessment for the Statement of Work."
        
        # 4. Call LLM
        response = self._call_llm(user_message)
        
        return {"content": response}
