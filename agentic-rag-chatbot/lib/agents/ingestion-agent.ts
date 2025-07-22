import type { MCPMessage, DocumentChunk, ProcessingResult, AgentResponse } from "./types"
import { messageBus } from "./message-bus"

export class IngestionAgent {
  private agentId = "IngestionAgent"

  constructor() {
    messageBus.subscribe(this.agentId, this.handleMessage.bind(this))
  }

  private async handleMessage(message: MCPMessage) {
    if (message.type === "DOCUMENT_PROCESS_REQUEST") {
      await this.processDocument(message)
    }
  }

  async processDocument(message: MCPMessage): Promise<AgentResponse> {
    const { documentId, content, filename, fileType } = message.payload

    try {
      console.log(`[${this.agentId}] Processing document: ${filename}`)

      // Simulate document parsing based on file type
      const chunks = await this.parseDocument(content, fileType, filename)

      const result: ProcessingResult = {
        documentId,
        chunks,
        metadata: {
          totalChunks: chunks.length,
          processingTime: Date.now(),
          format: fileType,
        },
      }

      // Send success message to coordinator
      const responseMessage = messageBus.createMessage(
        this.agentId,
        "CoordinatorAgent",
        "DOCUMENT_PROCESSED",
        message.trace_id,
        {
          success: true,
          result,
        },
      )

      messageBus.publish(responseMessage)

      // Send chunks to retrieval agent for embedding
      const embeddingMessage = messageBus.createMessage(
        this.agentId,
        "RetrievalAgent",
        "EMBEDDING_REQUEST",
        message.trace_id,
        {
          documentId,
          chunks,
        },
      )

      messageBus.publish(embeddingMessage)

      return { success: true, data: result }
    } catch (error) {
      console.error(`[${this.agentId}] Error processing document:`, error)

      const errorMessage = messageBus.createMessage(
        this.agentId,
        "CoordinatorAgent",
        "DOCUMENT_PROCESS_ERROR",
        message.trace_id,
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          documentId,
        },
      )

      messageBus.publish(errorMessage)

      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  private async parseDocument(content: string, fileType: string, filename: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = []

    try {
      // Simple text chunking strategy
      const chunkSize = 500
      const overlap = 50

      let text = content

      // Handle empty or very short content
      if (!text || text.trim().length < 10) {
        throw new Error("Document appears to be empty or too short to process")
      }

      // Basic preprocessing based on file type
      if (fileType.includes("csv")) {
        // For CSV, treat each row as a potential chunk
        const lines = content.split("\n").filter((line) => line.trim())
        if (lines.length < 2) {
          throw new Error("CSV file appears to be empty or invalid")
        }

        const header = lines[0]
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            chunks.push({
              id: `${filename}_row_${i}`,
              content: `${header}\n${lines[i]}`,
              metadata: {
                source: filename,
                section: `Row ${i}`,
              },
            })
          }
        }
      } else {
        // For other formats, use sliding window chunking
        // Clean up the text first
        text = text.replace(/\s+/g, " ").trim()

        if (text.length < chunkSize) {
          // If document is smaller than chunk size, create one chunk
          chunks.push({
            id: `${filename}_chunk_0`,
            content: text,
            metadata: {
              source: filename,
              section: "Full Document",
            },
          })
        } else {
          // Create overlapping chunks
          for (let i = 0; i < text.length; i += chunkSize - overlap) {
            const chunk = text.slice(i, i + chunkSize)
            if (chunk.trim()) {
              chunks.push({
                id: `${filename}_chunk_${Math.floor(i / (chunkSize - overlap))}`,
                content: chunk.trim(),
                metadata: {
                  source: filename,
                  section: `Chunk ${Math.floor(i / (chunkSize - overlap)) + 1}`,
                },
              })
            }
          }
        }
      }

      if (chunks.length === 0) {
        throw new Error("No valid content could be extracted from the document")
      }

      console.log(`[IngestionAgent] Successfully created ${chunks.length} chunks from ${filename}`)
      return chunks
    } catch (error) {
      console.error(`[IngestionAgent] Error parsing document ${filename}:`, error)
      throw error
    }
  }
}
