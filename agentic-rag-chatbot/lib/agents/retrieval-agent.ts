import type { MCPMessage, DocumentChunk, RetrievalResult, AgentResponse } from "./types"
import { messageBus } from "./message-bus"
import { embed, embedMany, cosineSimilarity } from "ai"
import { openai } from "@ai-sdk/openai"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  throw new Error(
    "OPENAI_API_KEY environment variable is not set.  \
Add it to your `.env.local` or project settings.",
  )
}

export class RetrievalAgent {
  private agentId = "RetrievalAgent"
  private vectorStore: Map<string, DocumentChunk[]> = new Map()

  constructor() {
    messageBus.subscribe(this.agentId, this.handleMessage.bind(this))
  }

  private async handleMessage(message: MCPMessage) {
    switch (message.type) {
      case "EMBEDDING_REQUEST":
        await this.createEmbeddings(message)
        break
      case "RETRIEVAL_REQUEST":
        await this.retrieveRelevantChunks(message)
        break
    }
  }

  async createEmbeddings(message: MCPMessage): Promise<AgentResponse> {
    const { documentId, chunks } = message.payload

    try {
      console.log(`[${this.agentId}] Creating embeddings for ${chunks.length} chunks`)

      // Create embeddings for all chunks
      const texts = chunks.map((chunk: DocumentChunk) => chunk.content)
      const { embeddings } = await embedMany({
        model: openai.embedding("text-embedding-3-small", { apiKey: OPENAI_API_KEY }),
        values: texts,
      })

      // Store chunks with embeddings
      const chunksWithEmbeddings = chunks.map((chunk: DocumentChunk, index: number) => ({
        ...chunk,
        embedding: embeddings[index],
      }))

      this.vectorStore.set(documentId, chunksWithEmbeddings)

      // Notify coordinator
      const responseMessage = messageBus.createMessage(
        this.agentId,
        "CoordinatorAgent",
        "EMBEDDINGS_CREATED",
        message.trace_id,
        {
          success: true,
          documentId,
          chunkCount: chunks.length,
        },
      )

      messageBus.publish(responseMessage)

      return { success: true, data: { documentId, chunkCount: chunks.length } }
    } catch (error) {
      console.error(`[${this.agentId}] Error creating embeddings:`, error)

      const errorMessage = messageBus.createMessage(
        this.agentId,
        "CoordinatorAgent",
        "EMBEDDING_ERROR",
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

  async retrieveRelevantChunks(message: MCPMessage): Promise<AgentResponse> {
    const { query, documentIds, topK = 5 } = message.payload

    try {
      console.log(`[${this.agentId}] Retrieving chunks for query: "${query}"`)

      // Create embedding for query
      const { embedding: queryEmbedding } = await embed({
        model: openai.embedding("text-embedding-3-small", { apiKey: OPENAI_API_KEY }),
        value: query,
      })

      // Collect all relevant chunks from specified documents
      const allChunks: DocumentChunk[] = []
      for (const docId of documentIds) {
        const docChunks = this.vectorStore.get(docId)
        if (docChunks) {
          allChunks.push(...docChunks)
        }
      }

      if (allChunks.length === 0) {
        throw new Error("No chunks found for specified documents")
      }

      // Calculate similarities and rank chunks
      const rankedChunks = allChunks
        .map((chunk) => ({
          chunk,
          score: chunk.embedding ? cosineSimilarity(queryEmbedding, chunk.embedding) : 0,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)

      const result: RetrievalResult = {
        query,
        chunks: rankedChunks.map((item) => item.chunk),
        scores: rankedChunks.map((item) => item.score),
        totalResults: allChunks.length,
      }

      // Send results to LLM Response Agent
      const responseMessage = messageBus.createMessage(
        this.agentId,
        "LLMResponseAgent",
        "CONTEXT_RESPONSE",
        message.trace_id,
        {
          success: true,
          result,
          originalQuery: query,
        },
      )

      messageBus.publish(responseMessage)

      return { success: true, data: result }
    } catch (error) {
      console.error(`[${this.agentId}] Error retrieving chunks:`, error)

      const errorMessage = messageBus.createMessage(
        this.agentId,
        "CoordinatorAgent",
        "RETRIEVAL_ERROR",
        message.trace_id,
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          query,
        },
      )

      messageBus.publish(errorMessage)

      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }
}
