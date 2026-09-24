import config from "./config"

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface CompletionOptions {
  model?: string
  temperature?: number
  top_p?: number
  max_tokens?: number
  stop?: string[]
}

export interface CompletionResponse {
  text: string
  model: string
  metadata?: {
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
    finish_reason?: string
  }
}

class ApiClient {
  private authError = false

  async fetchModels(): Promise<{ id: string; name: string }[]> {
    try {
      const response = await fetch(config.apiEndpoints.models, { cache: "no-cache" })
      if (!response.ok) return config.availableModels
      const data = await response.json()
      return Array.isArray(data.models) ? data.models : config.availableModels
    } catch {
      return config.availableModels
    }
  }

  async generateCompletion(messages: ChatMessage[], options: CompletionOptions = {}): Promise<CompletionResponse> {
    const response = await fetch(config.apiEndpoints.completion, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, ...options }),
      signal: AbortSignal.timeout(30_000),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      this.authError = response.status === 401 || response.status === 503
      throw new Error(data.error || `Completion failed: ${response.status}`)
    }
    return { text: data.completion, model: data.model, metadata: { usage: data.usage } }
  }

  async validateApiKey(): Promise<boolean> { return true }
  setApiKey(_apiKey: string): void { this.authError = false }
  resetAuthError(): void { this.authError = false }
  hasApiKey(): boolean { return true }
  hasAuthError(): boolean { return this.authError }
}

let apiClientInstance: ApiClient | null = null
export function getApiClient(): ApiClient {
  if (!apiClientInstance) apiClientInstance = new ApiClient()
  return apiClientInstance
}
export function resetApiClient(): void { apiClientInstance = null }
