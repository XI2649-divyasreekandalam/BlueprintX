from typing import List
import tiktoken


def chunk_text(
    text: str,
    chunk_size: int = 512,
    chunk_overlap: int = 50,
    encoding_name: str = "cl100k_base"
) -> List[str]:
    """
    Split text into overlapping chunks based on token count.
    
    This function is token-aware (uses actual tokenization) but model-agnostic
    (supports different encodings for different models). The chunking is
    deterministic - the same input will always produce the same chunks.
    
    Args:
        text: The text to chunk
        chunk_size: Maximum number of tokens per chunk (default: 512)
        chunk_overlap: Number of tokens to overlap between chunks (default: 50)
        encoding_name: Tokenizer encoding name (default: "cl100k_base")
                      Common encodings:
                      - "cl100k_base": Used by GPT-4, GPT-3.5-turbo
                      - "p50k_base": Used by Codex models
                      - "r50k_base": Used by GPT-3 models
    
    Returns:
        List of text chunks, each respecting the chunk_size token limit
    
    Raises:
        ValueError: If chunk_size <= 0, chunk_overlap < 0, or chunk_overlap >= chunk_size
        ValueError: If encoding_name is invalid
    
    Example:
        >>> text = "Your long text here..."
        >>> chunks = chunk_text(text, chunk_size=100, chunk_overlap=20)
        >>> len(chunks)  # Number of chunks created
    """
    # Validation
    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than 0")
    if chunk_overlap < 0:
        raise ValueError("chunk_overlap must be non-negative")
    if chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be less than chunk_size")
    
    # Handle empty text
    if not text.strip():
        return []
    
    # Initialize tokenizer
    try:
        encoding = tiktoken.get_encoding(encoding_name)
    except KeyError as e:
        raise ValueError(f"Invalid encoding name: {encoding_name}") from e
    
    # Tokenize the entire text
    tokens = encoding.encode(text)
    
    # If text fits in one chunk, return it
    if len(tokens) <= chunk_size:
        return [text]
    
    # Calculate step size (how many tokens to advance for each chunk)
    step_size = chunk_size - chunk_overlap
    
    # Generate chunks
    chunks = []
    start_idx = 0
    
    while start_idx < len(tokens):
        # Get tokens for this chunk
        end_idx = start_idx + chunk_size
        chunk_tokens = tokens[start_idx:end_idx]
        
        # Decode tokens back to text
        chunk_text = encoding.decode(chunk_tokens)
        chunks.append(chunk_text)
        
        # Move to next chunk position
        start_idx += step_size
        
        # If we're at the end, break to avoid empty chunks
        if end_idx >= len(tokens):
            break
    
    return chunks

