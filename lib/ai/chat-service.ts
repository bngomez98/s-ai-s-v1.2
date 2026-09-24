import type { ChatMessage, CompletionOptions, CompletionResult, ModelInfo } from "../domain"
import type { ModelGateway } from "../ports"

export class ChatService {
  constructor(private readonly gateway: ModelGateway) {}

  complete(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResult> {
    if (!Array.isArray(messages) || messages.length === 0) throw new Error("At least one chat message is required")
    return this.gateway.complete(messages, options)
  }

  listModels(): Promise<ModelInfo[]> {
    return this.gateway.listModels()
  }
}
