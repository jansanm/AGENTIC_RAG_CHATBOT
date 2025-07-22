export interface MCPMessage {
  id: string
  sender: string
  receiver: string
  type: string
  trace_id: string
  timestamp: Date
  payload: any
}

export interface DocumentChunk {
  id: string
  content: string
  metadata: {
    source: string
    page?: number
    section?: string
  }
  embedding?: number[]
}

export interface AgentResponse {
  success: boolean
  data?: any
  error?: string
  messages?: MCPMessage[]
}

export interface ProcessingResult {
  documentId: string
  chunks: DocumentChunk[]
  metadata: {
    totalChunks: number
    processingTime: number
    format: string
  }
}

export interface RetrievalResult {
  query: string
  chunks: DocumentChunk[]
  scores: number[]
  totalResults: number
}

export interface LLMResponse {
  answer: string
  sources: string[]
  confidence: number
  reasoning?: string
}
