import type { ChatMessage, CompletionOptions, CompletionResult, ModelInfo } from "../domain"
import type { ModelGateway } from "../ports"

const DEFAULT_MODELS: ModelInfo[] = [
  { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", name: "Llama 3.3 70B Instruct", multimodal: false },
  { id: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo", name: "Llama 3.2 11B Vision", multimodal: true },
  { id: "mistralai/Mistral-7B-Instruct-v0.2", name: "Mistral 7B Instruct", multimodal: false },
  { id: "mistralai/Mixtral-8x7B-Instruct-v0.1", name: "Mixtral 8x7B Instruct", multimodal: false },
]

export class TogetherModelGateway implements ModelGateway {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = process.env.TOGETHER_BASE_URL || "https://api.together.xyz/v1",
  ) {}

  private normalizeMessages(messages: ChatMessage[]) {
    return messages.map((message) => ({
      role: message.role,
      content:
        typeof message.content === "string"
          ? message.content
          : message.content
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join("\n"),
    }))
  }

  async complete(messages: ChatMessage[], options: CompletionOptions = {}): Promise<CompletionResult> {
    if (!this.apiKey) throw new Error("TOGETHER_API_KEY is not configured")

    const model = options.model || process.env.AI_MODEL || DEFAULT_MODELS[0].id
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model,
        messages: this.normalizeMessages(messages),
        temperature: options.temperature ?? 0.7,
        top_p: options.top_p ?? 0.9,
        max_tokens: options.max_tokens ?? 1024,
        ...(options.stop?.length ? { stop: options.stop } : {}),
      }),
      signal: AbortSignal.timeout(30_000),
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const detail = payload?.error?.message || payload?.error || response.statusText
      throw new Error(`Model gateway request failed (${response.status}): ${detail}`)
    }

    const choice = payload?.choices?.[0]
    const content = choice?.message?.content
    const text =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content
              .filter((part: { type?: string; text?: string }) => part?.type === "text" || typeof part?.text === "string")
              .map((part: { text?: string }) => part.text || "")
              .join("")
          : ""

    if (!text) throw new Error("Model gateway returned no assistant content")

    return {
      text,
      model: payload.model || model,
      usage: payload.usage,
      finishReason: choice.finish_reason,
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    if (!this.apiKey) return DEFAULT_MODELS

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(10_000),
      })

      if (!response.ok) return DEFAULT_MODELS

      const payload = await response.json()
      const models = Array.isArray(payload?.data)
        ? payload.data
            .filter((model: { id?: string }) => model.id && /llama|mistral|mixtral|qwen|gemma/i.test(model.id))
            .map((model: { id: string; display_name?: string; name?: string }) => ({
              id: model.id,
              name: model.display_name || model.name || model.id.split("/").pop() || model.id,
              multimodal: /vision/i.test(model.id),
            }))
        : []

      return models.length ? models : DEFAULT_MODELS
    } catch {
      return DEFAULT_MODELS
    }
  }
}
