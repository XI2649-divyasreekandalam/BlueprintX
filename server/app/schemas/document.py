from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Dict, Any


class UploadedDocument(BaseModel):
    """
    Schema for an uploaded document.
    
    This schema is used across ingestion, agents, and storage layers
    to represent a document that has been uploaded to the system.
    
    Attributes:
        id: Unique identifier for the document (UUID)
        filename: Original filename of the uploaded document
        content_type: MIME type of the document (e.g., 'application/pdf', 'text/plain')
        upload_time: Timestamp when the document was uploaded
    """
    
    id: UUID = Field(..., description="Unique identifier for the document")
    filename: str = Field(..., description="Original filename of the uploaded document")
    content_type: str = Field(..., description="MIME type of the document")
    upload_time: datetime = Field(..., description="Timestamp when the document was uploaded")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "filename": "example.pdf",
                "content_type": "application/pdf",
                "upload_time": "2024-01-15T10:30:00Z"
            }
        }
    }


class DocumentChunk(BaseModel):
    """
    Schema for a document chunk.
    
    This schema represents a portion of a document that has been chunked
    for processing. Used across ingestion, agents, and storage layers.
    
    Attributes:
        id: Unique identifier for the chunk (UUID)
        document_id: UUID of the parent document this chunk belongs to
        text: The text content of the chunk
        metadata: Additional metadata about the chunk (e.g., chunk_index, page_number)
    """
    
    id: UUID = Field(..., description="Unique identifier for the chunk")
    document_id: UUID = Field(..., description="UUID of the parent document")
    text: str = Field(..., description="The text content of the chunk")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata about the chunk"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "223e4567-e89b-12d3-a456-426614174001",
                "document_id": "123e4567-e89b-12d3-a456-426614174000",
                "text": "This is a sample chunk of text from the document.",
                "metadata": {
                    "chunk_index": 0,
                    "page_number": 1,
                    "start_char": 0,
                    "end_char": 50
                }
            }
        }
    }

