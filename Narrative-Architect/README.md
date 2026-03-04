# Narrative Architect (Facility Registry)

Narrative Architect is a React-based application designed to act as a "Facility Registry" database. It allows users to track, manage, and interact with structured lore entities (such as Assets, Personnel, Technology, and Anomalies) within a custom sci-fi setting.

The application features a built-in "Overseer Engine"—an LLM-powered chat interface that reads the biological and operational data of the currently active record, allowing users to query and expand upon the active entity using a local AI model.

## Features

- **Entity Management**: Create, read, update, and delete distinct categories of records (Assets, Personnel, Technology, Anomalies).
- **Dynamic Data Forms**: The user interface adapts its fields based on the type of entity currently selected.
- **Data Persistence**: Export your entire facility registry as a JSON backup file and restore it at any time.
- **Overseer Engine (LLM Chat)**: A built-in chat module that interfaces with a local Large Language Model (e.g., via Ollama). It dynamically injects the details of the currently selected entity into the system prompt, allowing the AI to stay in-context and maintain strict internal logic.

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm (or yarn/pnpm)
- (Optional) A local LLM server to use the Overseer Engine (e.g., [Ollama](https://ollama.com/)).

### Installation & Running the App

1. **Install dependencies**:
   Navigate to the project directory and run:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will typically be available at `http://localhost:5173/`.

### Configuring the Overseer Engine (LLM)

By default, the chat interface is configured to connect to a local Ollama instance running the `llama3` model.

1. **Install Ollama** and download a model (e.g., Llama 3):
   ```bash
   ollama run llama3
   ```
   *(Note: Ollama automatically runs an API server at `http://localhost:11434`)*

2. **CORS Configuration**: If you encounter CORS issues when the web app tries to communicate with your local Ollama server, you may need to start Ollama with the appropriate CORS environment variable set (e.g., `OLLAMA_ORIGINS="*" ollama serve`).

3. **In-App Settings**:
   Click the "Settings" (gear) icon in the top right of the "Mira / Overseer" chat panel to adjust the **Terminal Endpoint** (e.g., `http://localhost:11434/api/chat`) and the **Local Model Engine** (e.g., `llama3`) to match your local setup.
