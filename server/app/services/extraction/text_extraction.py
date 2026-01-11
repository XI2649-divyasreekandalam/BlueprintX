from pathlib import Path
import io
from pypdf import PdfReader


class UnsupportedFileFormatError(Exception):
    """
    Exception raised when attempting to extract text from an unsupported file format.
    
    Attributes:
        content_type: The content type that was not supported
        message: Error message
    """
    
    def __init__(self, content_type: str, message: str | None = None):
        self.content_type = content_type
        if message is None:
            message = f"Unsupported file format: {content_type}. Supported formats: application/pdf, text/plain"
        super().__init__(message)


class TextExtractionService:
    """
    Service for extracting text from document files.
    
    This service cleanly separates file handling from extraction logic.
    Supports PDF and TXT file formats.
    
    Attributes:
        SUPPORTED_FORMATS: Set of supported MIME types
    """
    
    SUPPORTED_FORMATS = {
        "application/pdf",
        "text/plain",
    }
    
    @staticmethod
    def _read_file_content(file_path: Path) -> bytes:
        """
        Read file content from disk.
        
        File handling logic - separated from extraction logic.
        
        Args:
            file_path: Path to the file to read
        
        Returns:
            File content as bytes
        
        Raises:
            FileNotFoundError: If the file does not exist
            IOError: If the file cannot be read
        """
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        try:
            with open(file_path, "rb") as f:
                return f.read()
        except IOError as e:
            raise IOError(f"Error reading file {file_path}: {str(e)}") from e
    
    @staticmethod
    def _extract_from_pdf(file_content: bytes) -> str:
        """
        Extract text from PDF file content.
        
        Extraction logic for PDF format.
        
        Args:
            file_content: PDF file content as bytes
        
        Returns:
            Extracted text from the PDF
        
        Raises:
            ValueError: If the PDF cannot be parsed
        """
        try:
            pdf_file = io.BytesIO(file_content)
            reader = PdfReader(pdf_file)
            
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            
            return "\n".join(text_parts)
        except Exception as e:
            raise ValueError(f"Error extracting text from PDF: {str(e)}") from e
    
    @staticmethod
    def _extract_from_txt(file_content: bytes) -> str:
        """
        Extract text from TXT file content.
        
        Extraction logic for plain text format.
        
        Args:
            file_content: TXT file content as bytes
        
        Returns:
            Extracted text from the TXT file
        
        Raises:
            ValueError: If the file cannot be decoded as UTF-8
        """
        try:
            return file_content.decode("utf-8")
        except UnicodeDecodeError as e:
            raise ValueError(f"Error decoding text file as UTF-8: {str(e)}") from e
    
    @classmethod
    def extract_text(cls, file_path: Path, content_type: str) -> str:
        """
        Extract text from a file.
        
        This method coordinates file handling and extraction logic.
        It reads the file and delegates to the appropriate extraction method
        based on the content type.
        
        Args:
            file_path: Path to the file to extract text from
            content_type: MIME type of the file (e.g., 'application/pdf', 'text/plain')
        
        Returns:
            Extracted text from the file
        
        Raises:
            UnsupportedFileFormatError: If the content type is not supported
            FileNotFoundError: If the file does not exist
            IOError: If the file cannot be read
            ValueError: If the file content cannot be parsed or decoded
        """
        # Validate format
        if content_type not in cls.SUPPORTED_FORMATS:
            raise UnsupportedFileFormatError(content_type)
        
        # File handling: Read file content
        file_content = cls._read_file_content(file_path)
        
        # Extraction logic: Extract text based on content type
        if content_type == "application/pdf":
            return cls._extract_from_pdf(file_content)
        elif content_type == "text/plain":
            return cls._extract_from_txt(file_content)
        else:
            # This should never happen due to validation above, but included for safety
            raise UnsupportedFileFormatError(content_type)

