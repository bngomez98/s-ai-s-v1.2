import type { ChatMessage, CompletionOptions, CompletionResult, ModelInfo } from "./domain"

export interface ModelGateway {
  complete(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResult>
  listModels(): Promise<ModelInfo[]>
}
