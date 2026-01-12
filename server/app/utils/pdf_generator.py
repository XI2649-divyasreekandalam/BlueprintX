from fpdf import FPDF
from typing import Dict, Any
from pathlib import Path
import io


class BlueprintPDFGenerator:
    """
    Utility for generating a professional PDF blueprint (Proposal SOW) from agent outputs.
    
    Supports Markdown-style formatting (bolding with **, headers with #) and UTF-8 characters.
    """
    
    def __init__(self, blueprint_data: Dict[str, Any]):
        self.data = blueprint_data
        # Use FPDF with UTF-8 support
        self.pdf = FPDF()
        self.pdf.set_auto_page_break(auto=True, margin=15)
        self.pdf.add_page()
        
        # Add a Unicode-compliant font if available, or just use core fonts
        # Core fonts like helvetica are available by default but have limited UTF-8 support
        # For simplicity and robustness, we'll stick to helvetica but handle encoding better
        self.pdf.set_font("helvetica", "B", 24)

    def generate(self) -> bytes:
        """
        Generate the PDF content as bytes.
        """
        # 1. Header / Title
        self.pdf.set_text_color(31, 73, 125)  # Professional dark blue
        self.pdf.cell(0, 20, "Statement of Work (SOW)", ln=True, align="C")
        self.pdf.set_text_color(0, 0, 0)      # Reset to black
        
        self.pdf.set_font("helvetica", "B", 16)
        self.pdf.cell(0, 10, "Generative AI Implementation Initiative", ln=True, align="C")
        self.pdf.ln(10)
        
        # 2. Main Content
        content = self.data.get("content", "No content provided.")
        
        # Process content to handle headers and bolding
        # fpdf2's write_html is often more reliable for mixed formatting than multi_cell(markdown=True)
        # but let's try a hybrid approach or clean multi_cell
        
        self.pdf.set_font("helvetica", "", 11)
        
        # Split content into lines and process each
        lines = str(content).split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                self.pdf.ln(5)
                continue
                
            # Handle Headers (e.g., # Header, ## Header)
            if line.startswith('#'):
                # Determine header level
                level = 0
                for char in line:
                    if char == '#': level += 1
                    else: break
                
                header_text = line.lstrip('#').strip()
                
                # Header styles
                if level == 1:
                    self.pdf.set_font("helvetica", "B", 18)
                    self.pdf.set_text_color(31, 73, 125)
                elif level == 2:
                    self.pdf.set_font("helvetica", "B", 14)
                    self.pdf.set_text_color(50, 50, 50)
                else:
                    self.pdf.set_font("helvetica", "B", 12)
                    self.pdf.set_text_color(0, 0, 0)
                
                self.pdf.multi_cell(0, 10, header_text)
                self.pdf.set_font("helvetica", "", 11)
                self.pdf.set_text_color(0, 0, 0)
                self.pdf.ln(2)
                
            else:
                # Regular line - check for bolding **text**
                # We use write() or multi_cell with markdown=True for the whole block
                # fpdf2's markdown support is actually quite good for **bold**
                self.pdf.multi_cell(0, 7, line, markdown=True)
                self.pdf.ln(1)
        
        # Output to bytes
        return self.pdf.output()


def generate_blueprint_pdf(blueprint_data: Dict[str, Any]) -> bytes:
    """Convenience function to generate blueprint PDF bytes."""
    generator = BlueprintPDFGenerator(blueprint_data)
    return generator.generate()
