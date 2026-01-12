# BlueprintX

BlueprintX is an AI-powered platform designed to streamline the high-value consulting phase of AI projects, specifically targeting **Use Case Discovery** and **AI Governance**.

## 🚀 The Problem
This project aims to streamline the initial, high-value consulting phase of an AI project—specifically the **Use Case Discovery** and **AI Governance** stages.

When a firm like **Xebia** starts a new AI project for a client, the first phase is often the slowest and most expensive due to:

*   **Figuring out what to build (Use Case Discovery)**: Consultants spend weeks reading mountains of client documents (strategy, old reports, IT diagrams) just to find the best place to use AI.
*   **Figuring out how to build it legally/safely (AI Governance)**: Even more time is spent ensuring the AI project won't break any banking or privacy rules (compliance and governance).

## ✨ What We Are Solving
BlueprintX solves this bottleneck by automating the heavy lifting of document analysis and framework synthesis. Our multi-agent AI system:
*   **Automates Analysis**: Rapidly processes strategy and technical documents that would take humans weeks to read.
*   **Discovery**: Identifies high-impact AI opportunities tailored to the client's specific business context.
*   **Governance-by-Design**: Automatically cross-references use cases against regulatory requirements to ensure safety from day one.
*   **Instant Blueprinting**: Generates a comprehensive, professional AI Blueprint PDF in minutes, accelerating the transition from "Discovery" to "Delivery".

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS (Urbanist & Vibur fonts)
- **Routing**: React Router DOM
- **Authentication**: Mock SSO with LocalStorage persistence

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **LLM**: Groq (Llama 3.1)
- **Embeddings**: OpenAI
- **Vector DB**: FAISS (Local)
- **Document Processing**: PyPDF, python-multipart

---

## 🏗 AI Multi-Agent Architecture
The server coordinates several specialized agents to build the blueprint:
- **Orchestrator**: Manages the flow and coordinates between agents.
- **Document Understanding**: Extracts and summarizes key info from PDFs.
- **Use Case Discovery**: Identifies high-value AI opportunities.
- **Solution Architecture**: Proposes technical stacks and implementation strategies.
- **Governance**: Checks for compliance with regulatory and safety standards.
- **Blueprint Synthesizer**: Merges agent outputs into a final structured PDF.

---

## 🏁 Getting Started

### 1. Prerequisites
- **Node.js** (v18+) & **npm**
- **Python** (3.10+)
- **Groq API Key** (Get it at [console.groq.com](https://console.groq.com/))

### 2. Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `server/` directory using the .env.example file:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```
5. Start the server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `client/` directory using the .env.example file:
   ```env
   VITE_BLUEPRINTX_SERVICE_URL=http://localhost:8000
   ```
4. Start the app:
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure
```text
BlueprintX/
├── client/                # React Frontend
│   ├── src/pages/         # Dashboard, Results, Login, etc.
│   ├── src/assets/        # UI Icons and Illustrations
│   └── tailwind.config.js # Theme configuration
├── server/                # FastAPI Backend
│   ├── app/agents/        # Multi-agent AI logic
│   ├── app/api/           # API Routes (Upload, Generate)
│   ├── app/services/      # LLM & Vector Store integration
│   └── data/              # Storage for uploads and generated PDFs
└── README.md              # Project documentation
```

## 📡 Key API Endpoints
- `POST /api/v1/upload`: Upload document(s). Returns a `document_id`.
- `POST /api/v1/generate-blueprint/{document_id}`: Triggers AI pipeline. Returns the generated PDF.

---

© 2026 BlueprintX. All Rights Reserved.
