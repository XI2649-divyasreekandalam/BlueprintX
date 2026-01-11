from pathlib import Path
from uuid import UUID
from typing import Dict, Any
from app.services.extraction import TextExtractionService
from app.utils import chunk_text
from app.services.embeddings import EmbeddingService
from app.services.vectorstores import FAISSVectorStore


import logging

logger = logging.getLogger(__name__)


class IngestionPipeline:
    """
    Pipeline for ingesting documents into the vector store.
    
    Orchestrates the complete ingestion flow:
    1. Extract text from document
    2. Chunk the extracted text
    3. Generate embeddings for chunks
    4. Store in vector store with metadata
    
    Attributes:
        extraction_service: Service for text extraction
        embedding_service: Service for generating embeddings
        vector_store: FAISS vector store for storage
        chunk_size: Size of text chunks (in tokens)
        chunk_overlap: Overlap between chunks (in tokens)
    """
    
    def __init__(
        self,
        vector_store: FAISSVectorStore,
        embedding_service: EmbeddingService,
        chunk_size: int = 512,
        chunk_overlap: int = 50
    ):
        """
        Initialize the ingestion pipeline.
        
        Args:
            vector_store: The FAISS vector store to store documents in
            embedding_service: Service for generating embeddings
            chunk_size: Maximum tokens per chunk (default: 512)
            chunk_overlap: Token overlap between chunks (default: 50)
        """
        self.extraction_service = TextExtractionService()
        self.embedding_service = embedding_service
        self.vector_store = vector_store
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def ingest_document(
        self,
        document_id: UUID,
        file_path: Path,
        content_type: str,
        additional_metadata: Dict[str, Any] | None = None
    ) -> Dict[str, Any]:
        """
        Ingest a document into the vector store.
        
        Performs the complete ingestion pipeline:
        1. Extract text from file
        2. Chunk the text
        3. Generate embeddings for chunks
        4. Store in vector store
        
        Args:
            document_id: UUID of the document
            file_path: Path to the document file
            content_type: MIME type of the document (e.g., 'application/pdf')
            additional_metadata: Optional additional metadata to include with chunks
        
        Returns:
            Dictionary with ingestion statistics:
            - 'document_id': UUID of the document
            - 'chunks_created': Number of chunks created
            - 'embeddings_generated': Number of embeddings generated
            - 'chunks_stored': Number of chunks stored in vector store
            - 'text_length': Total length of extracted text
        
        Raises:
            FileNotFoundError: If file doesn't exist
            ValueError: If extraction, chunking, or embedding fails
            Exception: If vector store operations fail
        """
        logger.info(f"Starting ingestion for document {document_id} from {file_path}")
        
        # Step 1: Extract text
        extracted_text = self.extraction_service.extract_text(file_path, content_type)
        text_length = len(extracted_text)
        logger.info(f"Extracted {text_length} characters of text from {file_path}")
        
        # Step 2: Chunk text
        text_chunks = chunk_text(
            text=extracted_text,
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap
        )
        chunks_created = len(text_chunks)
        logger.info(f"Created {chunks_created} chunks from extracted text")
        
        if chunks_created == 0:
            logger.warning(f"No chunks created for document {document_id}. Text might be empty.")
            return {
                "document_id": str(document_id),
                "chunks_created": 0,
                "embeddings_generated": 0,
                "chunks_stored": 0,
                "text_length": text_length
            }
        
        # Step 3: Generate embeddings
        logger.info(f"Generating embeddings for {chunks_created} chunks...")
        embeddings = self.embedding_service.generate_embeddings(text_chunks)
        embeddings_generated = len(embeddings)
        
        # Step 4: Prepare metadata for each chunk
        metadata_list = []
        for i, chunk_text_content in enumerate(text_chunks):
            chunk_metadata = {
                "document_id": str(document_id),
                "chunk_index": i,
                "text": chunk_text_content,
                "content_type": content_type,
                "file_path": str(file_path),
            }
            if additional_metadata:
                chunk_metadata.update(additional_metadata)
            metadata_list.append(chunk_metadata)
        
        # Step 5: Store in vector store
        logger.info(f"Storing {chunks_created} chunks in vector store...")
        chunk_ids = self.vector_store.add_documents(embeddings, metadata_list)
        chunks_stored = len(chunk_ids)
        
        logger.info(f"Ingestion complete for document {document_id}")
        
        # Return statistics
        return {
            "document_id": str(document_id),
            "chunks_created": chunks_created,
            "embeddings_generated": embeddings_generated,
            "chunks_stored": chunks_stored,
            "text_length": text_length
        }

