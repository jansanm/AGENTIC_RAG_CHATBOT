import { type NextRequest, NextResponse } from "next/server"
import { CoordinatorAgent } from "@/lib/agents/coordinator-agent"
import { documentStore } from "@/lib/document-store"

// Global coordinator instance
let coordinator: CoordinatorAgent | null = null

function getCoordinator() {
  if (!coordinator) {
    coordinator = new CoordinatorAgent()
  }
  return coordinator
}

export async function POST(request: NextRequest) {
  try {
    const { query, documentIds } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // If no documents are provided or ready, give a general response
    if (!documentIds || documentIds.length === 0) {
      return NextResponse.json({
        success: true,
        answer:
          "I don't have access to any documents right now, so I can't provide specific information about your uploaded files. Please upload and process documents first, or ask me general questions that don't require document context.",
        sources: [],
        confidence: 0,
        reasoning: "No documents available for context",
      })
    }

    // Verify documents exist and are ready
    const readyDocs = documentIds.filter((id: string) => {
      const doc = documentStore.get(id)
      return doc && doc.status === "ready"
    })

    if (readyDocs.length === 0) {
      return NextResponse.json({
        success: true,
        answer:
          "I can see you've uploaded documents, but they're either still processing or failed to process. I can't provide specific information about your documents right now. Please try re-uploading your files or wait for processing to complete.",
        sources: [],
        confidence: 0,
        reasoning: "No ready documents found",
      })
    }

    // Process query through coordinator
    const coord = getCoordinator()
    const response = await coord.processQuery(query, readyDocs)

    return NextResponse.json({
      success: true,
      answer: response.answer,
      sources: response.sources,
      confidence: response.confidence,
      reasoning: response.reasoning,
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({
      success: true,
      answer:
        "I encountered an error while processing your question. This might be due to document processing issues or system problems. Please try again or re-upload your documents.",
      sources: [],
      confidence: 0,
      reasoning: "Error occurred during processing",
    })
  }
}
