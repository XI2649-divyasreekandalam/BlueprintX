import faiss
import numpy as np
from typing import List, Dict, Any
from uuid import uuid4


class FAISSVectorStore:
    """
    FAISS-based vector store for similarity search.
    
    This class provides a clean interface for storing document embeddings
    and performing similarity searches. Metadata is stored separately from
    the FAISS index to allow flexible querying.
    
    Attributes:
        dimension: The dimension of the embeddings
        index: The FAISS index for vector storage and search
        metadata: List of metadata dictionaries, one per document
    """
    
    def __init__(self, dimension: int):
        """
        Initialize the FAISS vector store.
        
        Args:
            dimension: The dimension of the embeddings (must be > 0)
        
        Raises:
            ValueError: If dimension is not a positive integer
        """
        if dimension <= 0:
            raise ValueError("Dimension must be a positive integer")
        
        self.dimension = dimension
        # Initialize FAISS index with L2 distance (Euclidean)
        # Use IndexFlatL2 for exact search
        self.index = faiss.IndexFlatL2(dimension)
        # Store metadata for each document (indexed by position in FAISS index)
        self.metadata: List[Dict[str, Any]] = []
    
    def add_documents(
        self,
        embeddings: List[List[float]],
        metadata: List[Dict[str, Any]]
    ) -> List[str]:
        """
        Add documents to the vector store with embeddings and metadata.
        
        Args:
            embeddings: List of embedding vectors (each is a list of floats)
            metadata: List of metadata dictionaries, one per document
        
        Returns:
            List of document IDs (UUIDs as strings) assigned to the added documents
        
        Raises:
            ValueError: If embeddings and metadata lists have different lengths
            ValueError: If any embedding dimension doesn't match the store dimension
            ValueError: If embeddings list is empty
        """
        if len(embeddings) != len(metadata):
            raise ValueError(
                f"Number of embeddings ({len(embeddings)}) must match "
                f"number of metadata entries ({len(metadata)})"
            )
        
        if len(embeddings) == 0:
            raise ValueError("Cannot add empty list of documents")
        
        # Validate embedding dimensions
        for i, embedding in enumerate(embeddings):
            if len(embedding) != self.dimension:
                raise ValueError(
                    f"Embedding at index {i} has dimension {len(embedding)}, "
                    f"expected {self.dimension}"
                )
        
        # Generate document IDs for each document
        document_ids = [str(uuid4()) for _ in range(len(embeddings))]
        
        # Add document IDs to metadata
        enriched_metadata = []
        for meta, doc_id in zip(metadata, document_ids):
            enriched_meta = meta.copy()
            enriched_meta["document_id"] = doc_id
            enriched_metadata.append(enriched_meta)
        
        # Convert embeddings to numpy array (float32 for FAISS)
        embeddings_array = np.array(embeddings, dtype=np.float32)
        
        # Add to FAISS index
        self.index.add(embeddings_array)
        
        # Store metadata
        self.metadata.extend(enriched_metadata)
        
        # Log success
        import logging
        logging.getLogger(__name__).info(
            f"Successfully added {len(embeddings)} documents to FAISS index. "
            f"Total documents: {self.index.ntotal}"
        )
        
        return document_ids
    
    def similarity_search(
        self,
        query_embedding: List[float],
        k: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Perform similarity search to find the k most similar documents.
        
        Args:
            query_embedding: The query embedding vector
            k: Number of most similar documents to return (default: 4)
        
        Returns:
            List of result dictionaries, each containing:
            - 'document_id': UUID of the document
            - 'metadata': The document's metadata
            - 'distance': The L2 distance to the query (lower is more similar)
            - 'score': Similarity score (1 / (1 + distance) for easier interpretation)
        
        Raises:
            ValueError: If query embedding dimension doesn't match store dimension
            ValueError: If k is not a positive integer
            ValueError: If the index is empty
        """
        if self.index.ntotal == 0:
            raise ValueError("Cannot search empty index")
        
        if k <= 0:
            raise ValueError("k must be a positive integer")
        
        if len(query_embedding) != self.dimension:
            raise ValueError(
                f"Query embedding has dimension {len(query_embedding)}, "
                f"expected {self.dimension}"
            )
        
        # Ensure k doesn't exceed number of documents
        k = min(k, self.index.ntotal)
        
        # Convert query embedding to numpy array (float32, reshaped for FAISS)
        query_array = np.array([query_embedding], dtype=np.float32)
        
        # Perform search
        distances, indices = self.index.search(query_array, k)
        
        # Build results
        results = []
        for distance, idx in zip(distances[0], indices[0]):
            # FAISS returns -1 for invalid indices when k > ntotal
            if idx == -1:
                continue
            
            result = {
                "document_id": self.metadata[idx]["document_id"],
                "metadata": self.metadata[idx],
                "distance": float(distance),
                "score": float(1 / (1 + distance))  # Convert distance to similarity score
            }
            results.append(result)
        
        return results
    
    def get_document_count(self) -> int:
        """
        Get the number of documents in the vector store.
        
        Returns:
            Number of documents stored
        """
        return self.index.ntotal
    
    def is_empty(self) -> bool:
        """
        Check if the vector store is empty.
        
        Returns:
            True if no documents are stored, False otherwise
        """
        return self.index.ntotal == 0

