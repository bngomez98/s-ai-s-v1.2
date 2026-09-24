export type TextPart = { type: "text"; text: string }
export type ImagePart = { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } }
export type MessageContent = string | Array<TextPart | ImagePart>

export type ChatRole = "system" | "user" | "assistant"

export interface ChatMessage {
  role: ChatRole
  content: MessageContent
}

export interface CompletionOptions {
  model?: string
  temperature?: number
  top_p?: number
  max_tokens?: number
  stop?: string[]
}

export interface CompletionResult {
  text: string
  model: string
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
  finishReason?: string
}

export interface ModelInfo {
  id: string
  name: string
  multimodal?: boolean
}
