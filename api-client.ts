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
    usage?: {
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    }
    finish_reason?: string
  }
}

class ApiClient {
  private apiKey: string
  private authError = false

  constructor(apiKey = "") {
    // Try to get API key from multiple sources
    this.apiKey =
      apiKey ||
      localStorage.getItem("TOGETHER_API_KEY") ||
      this.getCookie("TOGETHER_API_KEY") ||
      config.togetherApiKey ||
      ""

    console.log(`API client initialized. API key status: ${this.apiKey ? "Present" : "Missing"}`)
  }

  // Helper to get cookie value
  private getCookie(name: string): string | null {
    if (typeof document === "undefined") return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null
    return null
  }

  async fetchModels(): Promise<{ id: string; name: string }[]> {
    try {
      // Check if API key is available
      if (!this.apiKey) {
        console.warn("No API key available. Using default models.")
        return config.availableModels
      }

      // If we've already detected an auth error, don't try again
      if (this.authError) {
        console.warn("Using default models due to previous authentication failure")
        return config.availableModels
      }

      // First try to fetch from the local API endpoint
      try {
        const response = await fetch("/api/models", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey, // Pass the key in headers too
          },
          // Add cache control to prevent stale data
          cache: "no-cache",
        })

        const data = await response.json()

        // Check if there was an authentication error
        if (response.status === 401 || data.needsApiKey) {
          console.error("Authentication error detected")
          this.authError = true
          return config.availableModels
        }

        if (!response.ok) {
          throw new Error(`Local API endpoint failed: ${response.status} ${response.statusText}`)
        }

        if (data && Array.isArray(data.models) && data.models.length > 0) {
          return data.models
        }

        // If local endpoint returns empty data, throw error to try direct API
        throw new Error("Local API endpoint returned empty data")
      } catch (localError) {
        console.warn("Local API endpoint failed:", localError)

        // If we already know there's an auth error, don't try direct API
        if (this.authError) {
          return config.availableModels
        }

        // If local endpoint fails, try direct API call
        const response = await fetch(config.apiEndpoints.models, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          // Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(10000),
        })

        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
          console.error("Authentication failed: Invalid API key (401 Unauthorized)")
          this.authError = true
          return config.availableModels
        }

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        // Check if data has the expected structure
        if (!data || !Array.isArray(data.data)) {
          console.warn("Unexpected API response format:", data)
          return config.availableModels
        }

        // List of models known to require dedicated endpoints
        const excludedModels = [
          "meta-llama/Llama-2-70b-chat-hf",
          "meta-llama/Llama-2-13b-chat-hf",
          "anthropic/claude-3-opus-20240229",
          "anthropic/claude-3-sonnet-20240229",
          "anthropic/claude-3-haiku-20240307",
          "meta-llama/Llama-3-70b-chat-hf",
          "meta-llama/Llama-3-8b-chat-hf",
        ]

        // Filter to chat/instruct models and format
        // Only include serverless models
        return data.data
          .filter(
            (model: any) =>
              model &&
              model.id &&
              (model.id.includes("chat") ||
                model.id.includes("instruct") ||
                model.id.includes("Mixtral") ||
                model.id.includes("gemma") ||
                model.id.includes("Qwen")) &&
              !excludedModels.includes(model.id) &&
              model.serverless !== false, // Only include serverless models
          )
          .map((model: any) => ({
            id: model.id,
            name: model.display_name || model.name || model.id.split("/").pop(),
          }))
      }
    } catch (error) {
      console.error("Error fetching models:", error)
      // Return default models as fallback
      return config.availableModels
    }
  }

  async generateCompletion(messages: ChatMessage[], options: CompletionOptions = {}): Promise<CompletionResponse> {
    const {
      model = config.defaultModel,
      temperature = config.systemSettings.temperature,
      top_p = config.systemSettings.topP,
      max_tokens = config.systemSettings.maxTokens,
      stop = undefined,
    } = options

    try {
      // Check if API key is available
      if (!this.apiKey) {
        throw new Error("No API key available")
      }

      // If we've already detected an auth error, don't try to make the request
      if (this.authError) {
        throw new Error("Authentication failed: Invalid API key")
      }

      console.log("Making API request to Together.ai with key:", this.apiKey ? "Present" : "Missing")

      const response = await fetch(config.apiEndpoints.together, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          top_p,
          max_tokens,
          stop,
        }),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000),
      })

      // Handle 401 Unauthorized specifically
      if (response.status === 401) {
        console.error("Authentication failed: Invalid API key (401 Unauthorized)")
        this.authError = true
        throw new Error("Authentication failed: Invalid API key")
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Completion failed: ${response.status} — ${errorText}`)
        throw new Error(`Completion failed: ${response.status} — ${errorText}`)
      }

      const result = await response.json()

      if (!result.choices || result.choices.length === 0) {
        throw new Error("No completion choices returned")
      }

      return {
        text: result.choices[0].message.content,
        model: model,
        metadata: {
          usage: result.usage,
          finish_reason: result.choices[0].finish_reason,
        },
      }
    } catch (error) {
      console.error("Error generating completion:", error)
      throw error
    }
  }

  // Method to validate API key
  async validateApiKey(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        return false
      }

      // If we've already detected an auth error, don't try again
      if (this.authError) {
        return false
      }

      const response = await fetch(config.apiEndpoints.models, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(5000),
      })

      // Handle 401 Unauthorized specifically
      if (response.status === 401) {
        this.authError = true
        return false
      }

      return response.ok
    } catch (error) {
      console.error("Error validating API key:", error)
      return false
    }
  }

  // Update API key and reset auth error state
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey
    this.authError = false
    console.log(`API key updated. Status: ${this.apiKey ? "Present" : "Missing"}`)
  }

  // Reset auth error state
  resetAuthError(): void {
    this.authError = false
  }

  // Check if we have an API key
  hasApiKey(): boolean {
    return !!this.apiKey
  }

  // Check if we have an auth error
  hasAuthError(): boolean {
    return this.authError
  }
}

// Create singleton instance
let apiClientInstance: ApiClient | null = null

export function getApiClient(): ApiClient {
  if (!apiClientInstance) {
    apiClientInstance = new ApiClient()
  }
  return apiClientInstance
}

// Reset the API client (useful for testing)
export function resetApiClient(): void {
  apiClientInstance = null
}

