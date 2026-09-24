import type { ChatMessage, CompletionOptions, CompletionResult, ModelInfo } from "../domain"
import type { ModelGateway } from "../ports"

const DEFAULT_MODELS: ModelInfo[] = [
  { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", name: "Llama 3.3 70B Instruct", multimodal: false },
  { id: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo", name: "Llama 3.2 11B Vision", multimodal: true },
  { id: "mistralai/Mistral-7B-Instruct-v0.2", name: "Mistral 7B Instruct", multimodal: false },
  { id: "mistralai/Mixtral-8x7B-Instruct-v0.1", name: "Mixtral 8x7B Instruct", multimodal: false },
]

const DEFAULT_BASE_URL = "https://api.together.xyz/v1"
const REQUEST_TIMEOUT_MS = 30_000
const MODELS_TIMEOUT_MS = 10_000

function required(value: string | undefined, name: string): string {
  const normalized = value?.trim()
  if (!normalized) throw new Error(`${name} is not configured`)
  return normalized
}

export class TogetherModelGateway implements ModelGateway {
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(apiKey = process.env.TOGETHER_API_KEY, baseUrl = process.env.TOGETHER_BASE_URL) {
    this.apiKey = required(apiKey, "TOGETHER_API_KEY")
    this.baseUrl = (baseUrl?.trim() || DEFAULT_BASE_URL).replace(/\/$/, "")
  }

  private requestInit(body?: unknown): RequestInit {
    return {
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(MODELS_TIMEOUT_MS),
      })
      if (!response.ok) throw new Error(`Model listing failed with status ${response.status}`)

      const payload = await response.json()
      const models = Array.isArray(payload?.data)
        ? payload.data
            .filter((model: { id?: unknown }) => typeof model.id === "string" && /llama|mistral|mixtral|qwen|gemma/i.test(model.id))
            .map((model: { id: string; display_name?: string; name?: string }) => ({
              id: model.id,
              name: model.display_name || model.name || model.id.split("/").pop() || model.id,
              multimodal: /vision/i.test(model.id),
            }))
        : []
      return models.length > 0 ? models : DEFAULT_MODELS
    } catch {
      return DEFAULT_MODELS
    }
  }
}
