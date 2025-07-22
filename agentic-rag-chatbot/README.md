# Agentic RAG Chatbot with Model Context Protocol (MCP)

A sophisticated multi-agent system for document-based question answering using Retrieval-Augmented Generation (RAG) with Model Context Protocol for inter-agent communication.

## 🏗️ Architecture

### Agent-Based System
- **CoordinatorAgent**: Orchestrates the entire workflow and manages agent communication
- **IngestionAgent**: Handles document parsing and preprocessing for multiple formats
- **RetrievalAgent**: Manages embeddings creation and semantic search
- **LLMResponseAgent**: Generates final responses using retrieved context

### Model Context Protocol (MCP)
All agents communicate through structured MCP messages:
\`\`\`json
{
  "id": "msg_123",
  "sender": "RetrievalAgent",
  "receiver": "LLMResponseAgent", 
  "type": "CONTEXT_RESPONSE",
  "trace_id": "query_456",
  "timestamp": "2024-01-01T00:00:00Z",
  "payload": {
    "top_chunks": ["...", "..."],
    "query": "What are the KPIs?"
  }
}
\`\`\`

## 🚀 Features

### Document Support
- ✅ PDF documents
- ✅ PowerPoint presentations (PPTX)
- ✅ CSV files
- ✅ Word documents (DOCX)
- ✅ Text and Markdown files

### Core Capabilities
- Multi-format document ingestion and parsing
- Vector embeddings with semantic search
- Multi-turn conversational interface
- Source attribution and confidence scoring
- Real-time processing status

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Node.js
- **AI/ML**: AI SDK, OpenAI GPT-4o, text-embedding-3-small
- **Vector Store**: In-memory vector database with cosine similarity
- **Architecture**: Multi-agent system with MCP messaging

## 📦 Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd agentic-rag-chatbot
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

**4. Add your OpenAI key**
Create `.env.local` in the project root:
\`\`\`env
OPENAI_API_KEY=your_openai_api_key_here
\`\`\`
(Alternatively set it in your Vercel Project → Settings → Environment Variables.)

5. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔄 System Flow

1. **Document Upload**: User uploads documents through the web interface
2. **Ingestion**: IngestionAgent parses and chunks documents
3. **Embedding**: RetrievalAgent creates vector embeddings for all chunks
4. **Query Processing**: User asks questions through the chat interface
5. **Retrieval**: RetrievalAgent finds relevant document chunks
6. **Response Generation**: LLMResponseAgent creates contextual answers
7. **Result Display**: User receives answers with source attribution

## 🧠 MCP Message Types

### Document Processing
- \`DOCUMENT_PROCESS_REQUEST\`: Initiate document processing
- \`DOCUMENT_PROCESSED\`: Document successfully processed
- \`EMBEDDING_REQUEST\`: Request embedding creation
- \`EMBEDDINGS_CREATED\`: Embeddings successfully created

### Query Processing
- \`RETRIEVAL_REQUEST\`: Request relevant chunk retrieval
- \`CONTEXT_RESPONSE\`: Return retrieved chunks with scores
- \`FINAL_RESPONSE\`: Generated answer with sources

### Error Handling
- \`DOCUMENT_PROCESS_ERROR\`: Document processing failed
- \`EMBEDDING_ERROR\`: Embedding creation failed
- \`RETRIEVAL_ERROR\`: Chunk retrieval failed
- \`LLM_RESPONSE_ERROR\`: Response generation failed

## 🎯 Usage

1. **Upload Documents**: Click "Upload Documents" and select files (PDF, PPTX, CSV, DOCX, TXT, MD)
2. **Wait for Processing**: Monitor document status in the sidebar
3. **Ask Questions**: Type questions in the chat interface
4. **Review Answers**: Get responses with source attribution and confidence scores

## 🔧 Configuration

### Chunk Size and Overlap
Modify in \`lib/agents/ingestion-agent.ts\`:
\`\`\`typescript
const chunkSize = 500
const overlap = 50
\`\`\`

### Retrieval Parameters
Adjust in query processing:
\`\`\`typescript
const topK = 5 // Number of chunks to retrieve
\`\`\`

### Model Configuration
Change models in respective agents:
\`\`\`typescript
// Embeddings
model: openai.embedding('text-embedding-3-small')

// Text generation  
model: openai('gpt-4o')
\`\`\`

## 🚧 Challenges Faced

1. **Inter-Agent Communication**: Implementing robust MCP messaging system
2. **Document Parsing**: Handling multiple file formats consistently
3. **Vector Search**: Optimizing similarity search performance
4. **Error Handling**: Managing failures across distributed agents
5. **State Management**: Coordinating async operations between agents

## 🔮 Future Improvements

- **Persistent Storage**: Add database for documents and embeddings
- **Advanced Parsing**: Better extraction for complex document structures
- **Streaming Responses**: Real-time response generation
- **Multi-Modal Support**: Image and audio document processing
- **Agent Monitoring**: Enhanced observability and debugging tools
- **Scalability**: Distributed agent deployment with message queues

## 📊 Performance Metrics

- Document processing: ~2-5 seconds per document
- Query response time: ~3-8 seconds
- Embedding creation: ~1-3 seconds per chunk
- Supported file size: Up to 10MB per document

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
