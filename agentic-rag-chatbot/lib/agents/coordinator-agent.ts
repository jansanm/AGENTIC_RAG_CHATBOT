import type { MCPMessage } from "./types"
import { messageBus } from "./message-bus"
import { IngestionAgent } from "./ingestion-agent"
import { RetrievalAgent } from "./retrieval-agent"
import { LLMResponseAgent } from "./llm-response-agent"

export class CoordinatorAgent {
  private agentId = "CoordinatorAgent"
  private ingestionAgent: IngestionAgent
  private retrievalAgent: RetrievalAgent
  private llmResponseAgent: LLMResponseAgent
  private activeTraces: Map<string, any> = new Map()

  constructor() {
    this.ingestionAgent = new IngestionAgent()
    this.retrievalAgent = new RetrievalAgent()
    this.llmResponseAgent = new LLMResponseAgent()

    messageBus.subscribe(this.agentId, this.handleMessage.bind(this))
  }

  private async handleMessage(message: MCPMessage) {
    console.log(`[${this.agentId}] Received message: ${message.type} from ${message.sender}`)

    // Update trace status
    if (this.activeTraces.has(message.trace_id)) {
      const trace = this.activeTraces.get(message.trace_id)
      trace.messages.push(message)
      trace.lastUpdate = new Date()
    }
  }

  async processDocument(documentId: string, content: string, filename: string, fileType: string): Promise<string> {
    const traceId = `doc_${documentId}_${Date.now()}`

    // Initialize trace
    this.activeTraces.set(traceId, {
      id: traceId,
      type: "document_processing",
      status: "started",
      messages: [],
      startTime: new Date(),
      lastUpdate: new Date(),
    })

    console.log(`[${this.agentId}] Starting document processing workflow for: ${filename}`)

    // Send processing request to ingestion agent
    const processMessage = messageBus.createMessage(
      this.agentId,
      "IngestionAgent",
      "DOCUMENT_PROCESS_REQUEST",
      traceId,
      {
        documentId,
        content,
        filename,
        fileType,
      },
    )

    messageBus.publish(processMessage)

    return traceId
  }

  async processQuery(query: string, documentIds: string[]): Promise<any> {
    const traceId = `query_${Date.now()}`

    // Initialize trace
    this.activeTraces.set(traceId, {
      id: traceId,
      type: "query_processing",
      status: "started",
      messages: [],
      startTime: new Date(),
      lastUpdate: new Date(),
    })

    console.log(`[${this.agentId}] Starting query processing workflow for: "${query}"`)

    return new Promise((resolve, reject) => {
      // Set up response handler
      const responseHandler = (message: MCPMessage) => {
        if (message.trace_id === traceId && message.type === "FINAL_RESPONSE") {
          resolve(message.payload.response)
        } else if (message.trace_id === traceId && message.type.includes("ERROR")) {
          reject(new Error(message.payload.error))
        }
      }

      messageBus.subscribe(`${this.agentId}_${traceId}`, responseHandler)

      // Send retrieval request
      const retrievalMessage = messageBus.createMessage(this.agentId, "RetrievalAgent", "RETRIEVAL_REQUEST", traceId, {
        query,
        documentIds,
        topK: 5,
      })

      messageBus.publish(retrievalMessage)

      // Set timeout
      setTimeout(() => {
        reject(new Error("Query processing timeout"))
      }, 30000) // 30 second timeout
    })
  }

  getTraceStatus(traceId: string) {
    return this.activeTraces.get(traceId)
  }

  getAllTraces() {
    return Array.from(this.activeTraces.values())
  }
}
