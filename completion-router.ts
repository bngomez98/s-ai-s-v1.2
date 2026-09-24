export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: import("./lib/ai/domain").MessageContent
}

export type CompletionOptions = import("./lib/ai/domain").CompletionOptions

export async function fetchAvailableModels(): Promise<string[]> {
  const response = await fetch("/api/models")
  if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`)
  const data = await response.json()
  return Array.isArray(data.models) ? data.models.map((model: { id: string }) => model.id) : []
}

export async function completeWithAI(messages: ChatMessage[], options: CompletionOptions = {}): Promise<string> {
  const response = await fetch("/api/completion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, ...options }),
  })

  const result = await response.json()
  if (!response.ok) throw new Error(result.error || `Completion failed: ${response.status}`)
  return result.completion
}
