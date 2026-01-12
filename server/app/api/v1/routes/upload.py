from fastapi import APIRouter, UploadFile, File, HTTPException
from uuid import uuid4
from pathlib import Path
import aiofiles
from typing import Annotated

router = APIRouter(tags=["upload"])

# Upload directory
UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Validation constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


@router.post("")
async def upload_file(
    file: Annotated[UploadFile, File(description="File to upload")]
) -> dict:
    """
    Upload a file and save it to the server.
    
    Performs basic validation on file size and content type.
    Saves the file to /data/uploads directory and returns a document UUID.
    
    Args:
        file: The uploaded file
    
    Returns:
        Dictionary containing the document ID (UUID)
    
    Raises:
        HTTPException: If file validation fails (size or content type)
        HTTPException: If file save operation fails
    """
    # Validate file size
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File size ({file_size} bytes) exceeds maximum allowed size ({MAX_FILE_SIZE} bytes)"
        )
    
    if file_size == 0:
        raise HTTPException(
            status_code=400,
            detail="File is empty"
        )
    
    # Validate content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Content type '{file.content_type}' is not supported. Allowed types: {', '.join(ALLOWED_CONTENT_TYPES)}"
        )
    
    # Generate document ID
    document_id = uuid4()
    
    # Create filename with document ID to avoid collisions
    file_extension = Path(file.filename).suffix if file.filename else ""
    saved_filename = f"{document_id}{file_extension}"
    file_path = UPLOAD_DIR / saved_filename
    
    try:
        # Save file asynchronously
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(file_content)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}"
        )
    
    return {"document_id": str(document_id)}

