import type { MCPMessage } from "./types"

class MessageBus {
  private subscribers: Map<string, ((message: MCPMessage) => void)[]> = new Map()
  private messageHistory: MCPMessage[] = []

  subscribe(agentId: string, callback: (message: MCPMessage) => void) {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, [])
    }
    this.subscribers.get(agentId)!.push(callback)
  }

  publish(message: MCPMessage) {
    this.messageHistory.push(message)

    // Send to specific receiver
    const receiverCallbacks = this.subscribers.get(message.receiver)
    if (receiverCallbacks) {
      receiverCallbacks.forEach((callback) => callback(message))
    }

    // Also send to coordinator if not already the receiver
    if (message.receiver !== "CoordinatorAgent") {
      const coordinatorCallbacks = this.subscribers.get("CoordinatorAgent")
      if (coordinatorCallbacks) {
        coordinatorCallbacks.forEach((callback) => callback(message))
      }
    }
  }

  getMessageHistory(traceId?: string): MCPMessage[] {
    if (traceId) {
      return this.messageHistory.filter((msg) => msg.trace_id === traceId)
    }
    return this.messageHistory
  }

  createMessage(sender: string, receiver: string, type: string, traceId: string, payload: any): MCPMessage {
    return {
      id: Math.random().toString(36).substr(2, 9),
      sender,
      receiver,
      type,
      trace_id: traceId,
      timestamp: new Date(),
      payload,
    }
  }
}

export const messageBus = new MessageBus()
