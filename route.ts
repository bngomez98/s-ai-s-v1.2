import { NextResponse } from "next/server"
import { preprocessUserMessage } from "@/lib/message-processor"
import { formatToPlainText } from "@/lib/fallback-processor"
import { getMemoryManager } from "@/lib/memory-manager"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, model, temperature, top_p, max_tokens, stop } = await req.json()

    // Get API key from environment variable
    const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY

    if (!TOGETHER_API_KEY) {
      return NextResponse.json({ error: "API key is not configured in environment variables." }, { status: 500 })
    }

    // Process the last user message with advanced NLP
    const lastUserMessage = messages.filter((m) => m.role === "user").pop()
    if (lastUserMessage) {
      lastUserMessage.content = await preprocessUserMessage(lastUserMessage.content)
    }

    // Add relevant memories from memory manager if available
    const memoryManager = getMemoryManager()
    if (lastUserMessage) {
      const relatedMemories = memoryManager.getRelatedMemories(lastUserMessage.content, 3)

      if (relatedMemories.length > 0) {
        // Insert relevant memories as system messages before the user's query
        const memoryContext = relatedMemories.map((memory) => ({
          role: "system",
          content: `Relevant context: ${memory.content}`,
        }))

        // Find the last system message index or insert at beginning
        const lastSystemIndex = messages.findIndex((m) => m.role === "system")
        if (lastSystemIndex >= 0) {
          messages.splice(lastSystemIndex + 1, 0, ...memoryContext)
        } else {
          messages.unshift(...memoryContext)
        }
      }
    }

    try {
      // Make the API request to Together.ai
      const response = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOGETHER_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: temperature || 0.7,
          top_p: top_p || 0.9,
          max_tokens: max_tokens || 1024,
          stop,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Together.ai API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from Together.ai API")
      }

      // Extract the completion text
      const completionText = data.choices[0].message.content

      // Format to plain text while preserving structure
      const formattedResponse = formatToPlainText(completionText)

      // Store the completion in memory for future reference
      if (lastUserMessage) {
        memoryManager.addEntry({
          id: `user-${Date.now()}`,
          role: "user",
          content: lastUserMessage.content,
          timestamp: new Date(),
          metadata: {
            importance: 0.5,
          },
        })

        memoryManager.addEntry({
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: formattedResponse,
          timestamp: new Date(),
          metadata: {
            importance: 0.5,
            model,
          },
        })
      }

      return NextResponse.json({ completion: formattedResponse })
    } catch (error) {
      console.error("API error:", error)
      throw error
    }
  } catch (error) {
    console.error("Completion API error:", error)
    return NextResponse.json({ error: `Failed to process your request: ${error.message}` }, { status: 500 })
  }
}

