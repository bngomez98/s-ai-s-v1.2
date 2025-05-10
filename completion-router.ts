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

export async function fetchAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch("/api/models")

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`)
    }

    const data = await response.json()
    return data.models.map((model: { id: string }) => model.id)
  } catch (error) {
    console.error("Error fetching models:", error)
    // Return default models if API call fails
    return [
      "mistralai/Mixtral-8x7B-Instruct-v0.1",
      "meta-llama/Llama-2-70b-chat-hf",
      "mistralai/Mistral-7B-Instruct-v0.2",
    ]
  }
}

export async function completeWithAI(messages: ChatMessage[], options: CompletionOptions = {}): Promise<string> {
  try {
    const {
      model = "mistralai/Mixtral-8x7B-Instruct-v0.1",
      temperature = 0.7,
      top_p = 0.9,
      max_tokens = 1024,
      stop = undefined,
    } = options

    const payload = {
      messages,
      model,
      temperature,
      top_p,
      max_tokens,
      stop,
    }

    const response = await fetch("/api/completion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Completion failed: ${response.status} — ${errorText}`)
    }

    const result = await response.json()
    return result.completion
  } catch (error) {
    console.error("Error completing with AI:", error)

    // Use local fallback if API call fails
    return generateLocalFallbackResponse(messages)
  }
}

// Local fallback response generator
function generateLocalFallbackResponse(messages: ChatMessage[]): string {
  // Extract the last user message
  const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || ""

  // Simple response based on message content
  if (lastUserMessage.toLowerCase().includes("hello") || lastUserMessage.toLowerCase().includes("hi")) {
    return "Hello! I'm currently operating in fallback mode due to a connection issue. I can still assist you with basic information while we restore full functionality."
  }

  if (lastUserMessage.toLowerCase().includes("help") || lastUserMessage.toLowerCase().includes("can you")) {
    return "I'd be happy to help. I'm currently operating with limited capabilities due to a connection issue, but I'll do my best to assist you with your query."
  }

  if (lastUserMessage.toLowerCase().includes("?")) {
    return "That's an interesting question. I'm currently operating in fallback mode with limited access to my neural core. Once full connectivity is restored, I'll be able to provide a more comprehensive answer."
  }

  // Default response
  return "I've received your message. I'm currently operating with limited connectivity to my neural core, but I'm still here to assist you as best I can. Could you please try again in a moment when full connectivity is restored?"
}

