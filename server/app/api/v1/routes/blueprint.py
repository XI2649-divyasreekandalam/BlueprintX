from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from uuid import UUID
from pathlib import Path
import logging
import asyncio
import os
from app.core.services import blueprint_orchestrator, ingestion_pipeline
from app.utils.pdf_generator import generate_blueprint_pdf

router = APIRouter(tags=["blueprint"])

logger = logging.getLogger(__name__)

# Directory where uploaded files are stored
UPLOAD_DIR = Path("data/uploads")
# Directory where generated blueprints are stored
BLUEPRINT_DIR = Path("data/blueprints")
BLUEPRINT_DIR.mkdir(parents=True, exist_ok=True)

@router.get("/generate-blueprint/{document_id}")
async def generate_blueprint(document_id: UUID):
    """
    Invokes the orchestrator to generate an AI blueprint from an uploaded document
    and returns the final PDF file directly.
    
    Args:
        document_id: The UUID of the uploaded document.
    
    Returns:
        A FileResponse containing the generated blueprint PDF.
    """
    
    # 1. Find the uploaded file
    file_path = None
    content_type = "application/pdf" # Default assumption
    
    if not UPLOAD_DIR.exists():
        raise HTTPException(status_code=404, detail="Upload directory not found")
        
    for file in UPLOAD_DIR.iterdir():
        if file.name.startswith(str(document_id)):
            file_path = file
            if file.suffix.lower() == ".txt":
                content_type = "text/plain"
            break
            
    if not file_path:
        raise HTTPException(status_code=404, detail=f"Document with ID {document_id} not found")

    try:
        # Step 1: Ingestion
        logger.info(f"Starting ingestion for {document_id}")
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None, 
            ingestion_pipeline.ingest_document, 
            document_id, 
            file_path, 
            content_type
        )
        
        # Step 2: Orchestration
        logger.info(f"Starting orchestration for {document_id}")
        initial_input = {
            "query": "Generate a comprehensive GenAI Statement of Work (SOW) based on this document.",
            "k": 5
        }
        
        final_result = await loop.run_in_executor(
            None,
            blueprint_orchestrator.execute,
            initial_input
        )
        
        # The final blueprint is the output of the 'synthesize' step
        blueprint_data = final_result.get("synthesize", final_result)
        
        # Step 3: PDF Generation
        logger.info(f"Generating PDF for {document_id}")
        pdf_bytes = await loop.run_in_executor(
            None,
            generate_blueprint_pdf,
            blueprint_data
        )
        
        # Save PDF to disk
        blueprint_path = BLUEPRINT_DIR / f"{document_id}.pdf"
        with open(blueprint_path, "wb") as f:
            f.write(pdf_bytes)
        
        logger.info(f"Blueprint generation complete for {document_id}")
        
        # Return the file directly
        return FileResponse(
            path=blueprint_path,
            media_type="application/pdf",
            filename=f"{document_id}.pdf"
        )
            
    except Exception as e:
        logger.error(f"Error generating blueprint for {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

