import type { MCPMessage, LLMResponse, AgentResponse } from "./types"
import { messageBus } from "./message-bus"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  throw new Error(
    "OPENAI_API_KEY environment variable is not set.  \
Add it to your `.env.local` or project settings.",
  )
}

export class LLMResponseAgent {
  private agentId = "LLMResponseAgent"

  constructor() {
    messageBus.subscribe(this.agentId, this.handleMessage.bind(this))
  }

  private async handleMessage(message: MCPMessage) {
    if (message.type === "CONTEXT_RESPONSE") {
      await this.generateResponse(message)
    }
  }

  async generateResponse(message: MCPMessage): Promise<AgentResponse> {
    const { result, originalQuery } = message.payload

    try {
      console.log(`[${this.agentId}] Generating response for query: "${originalQuery}"`)

      // Prepare context from retrieved chunks
      const context = result.chunks
        .map(
          (chunk: any, index: number) =>
            `[Source: ${chunk.metadata.source}, Section: ${chunk.metadata.section}]\n${chunk.content}`,
        )
        .join("\n\n---\n\n")

      // Generate response using LLM
      const { text } = await generateText({
        model: openai("gpt-4o", { apiKey: OPENAI_API_KEY }),
        system: `You are a helpful assistant that answers questions based on provided context. 
                 Always cite your sources and be specific about which documents you're referencing.
                 If the context doesn't contain enough information to answer the question, say so clearly.`,
        prompt: `Context from documents:
${context}

Question: ${originalQuery}

Please provide a comprehensive answer based on the context above. Include specific references to the source documents.`,
      })

      // Extract sources from the chunks
      const sources = [...new Set(result.chunks.map((chunk: any) => chunk.metadata.source))]

      const llmResponse: LLMResponse = {
        answer: text,
        sources,
        confidence: this.calculateConfidence(result.scores),
        reasoning: `Based on ${result.chunks.length} relevant chunks from ${sources.length} documents`,
      }

      // Send final response to coordinator
      const responseMessage = messageBus.createMessage(
        this.agentId,
        "CoordinatorAgent",
        "FINAL_RESPONSE",
        message.trace_id,
        {
          success: true,
          response: llmResponse,
          originalQuery,
        },
      )

      messageBus.publish(responseMessage)

      return { success: true, data: llmResponse }
    } catch (error) {
      console.error(`[${this.agentId}] Error generating response:`, error)

      const errorMessage = messageBus.createMessage(
        this.agentId,
        "CoordinatorAgent",
        "LLM_RESPONSE_ERROR",
        message.trace_id,
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          originalQuery,
        },
      )

      messageBus.publish(errorMessage)

      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  private calculateConfidence(scores: number[]): number {
    if (scores.length === 0) return 0
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
    return Math.min(avgScore * 100, 100) // Convert to percentage, cap at 100
  }
}
