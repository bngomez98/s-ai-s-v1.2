import type { ChatMessage, CompletionOptions, CompletionResult, ModelInfo } from "../domain"
import type { ModelGateway } from "../ports"

const REQUEST_TIMEOUT_MS = 30_000
const MODELS_TIMEOUT_MS = 10_000

function required(value: string | undefined, name: string): string {
  const normalized = value?.trim()
  if (!normalized) throw new Error(`${name} is not configured`)
  return normalized
}

/** Gateway for any OpenAI-compatible chat-completions API. */
export class OpenAICompatibleModelGateway implements ModelGateway {
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(apiKey = process.env.AI_API_KEY, baseUrl = process.env.AI_BASE_URL) {
    this.apiKey = required(apiKey, "AI_API_KEY")
    this.baseUrl = required(baseUrl, "AI_BASE_URL").replace(/\/$/, "")
  }

  private requestInit(body?: unknown, timeout = REQUEST_TIMEOUT_MS): RequestInit {
    return {
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      signal: AbortSignal.timeout(timeout),
    }
  }

  async complete(messages: ChatMessage[], options: CompletionOptions = {}): Promise<CompletionResult> {
    const model = options.model?.trim() || process.env.AI_MODEL?.trim()
    if (!model) throw new Error("AI_MODEL is not configured")

    const response = await fetch(
      `${this.baseUrl}/chat/completions`,
      this.requestInit({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        top_p: options.top_p ?? 0.9,
        max_tokens: options.max_tokens ?? 1024,
        ...(options.stop?.length ? { stop: options.stop } : {}),
      }),
    )

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const detail = typeof payload?.error?.message === "string" ? payload.error.message : response.statusText
      throw new Error(`Model gateway request failed (${response.status}): ${detail}`)
    }

    const choice = payload?.choices?.[0]
    const content = choice?.message?.content
    const text = Array.isArray(content)
      ? content.map((part: { text?: unknown }) => (typeof part.text === "string" ? part.text : "")).join("")
      : typeof content === "string"
        ? content
        : ""

    if (!text.trim()) throw new Error("Model gateway returned no assistant content")
    return { text, model: typeof payload.model === "string" ? payload.model : model, usage: payload.usage, finishReason: choice.finish_reason }
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, this.requestInit(undefined, MODELS_TIMEOUT_MS))
      if (!response.ok) return []
      const payload = await response.json()
      return Array.isArray(payload?.data)
        ? payload.data
            .filter((model: { id?: unknown }) => typeof model.id === "string")
            .map((model: { id: string; name?: string; display_name?: string }) => ({
              id: model.id,
              name: model.display_name || model.name || model.id,
              multimodal: /vision/i.test(model.id),
            }))
        : []
    } catch {
      return []
    }
  }
}
