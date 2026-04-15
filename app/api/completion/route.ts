import { NextResponse } from "next/server"
import { preprocessUserMessage } from "@/message-processor"
import { formatToPlainText } from "@/fallback-processor"
import { getMemoryManager } from "@/memory-manager"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, model, temperature, top_p, max_tokens, stop } = await req.json()
    const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY

    if (!TOGETHER_API_KEY) {
      return NextResponse.json({ error: "API key is not configured in environment variables." }, { status: 500 })
    }

    const lastUserMessage = messages.filter((m: { role: string }) => m.role === "user").pop()
    if (lastUserMessage) {
      lastUserMessage.content = await preprocessUserMessage(lastUserMessage.content)
    }

    const memoryManager = getMemoryManager()
    if (lastUserMessage) {
      const relatedMemories = memoryManager.getRelatedMemories(lastUserMessage.content, 3)
      if (relatedMemories.length > 0) {
        const memoryContext = relatedMemories.map((memory: { content: string }) => ({
          role: "system",
          content: `Relevant context: ${memory.content}`,
        }))
        const lastSystemIndex = messages.findIndex((m: { role: string }) => m.role === "system")
        if (lastSystemIndex >= 0) {
          messages.splice(lastSystemIndex + 1, 0, ...memoryContext)
        } else {
          messages.unshift(...memoryContext)
        }
      }
    }

    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOGETHER_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: temperature ?? 0.7,
        top_p: top_p ?? 0.9,
        max_tokens: max_tokens ?? 1024,
        stop,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Together.ai API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    if (!data.choices?.[0]?.message) {
      throw new Error("Invalid response format from Together.ai API")
    }

    const completionText = data.choices[0].message.content
    const formattedResponse = formatToPlainText(completionText)

    if (lastUserMessage) {
      memoryManager.addEntry({
        id: `user-${Date.now()}`,
        role: "user",
        content: lastUserMessage.content,
        timestamp: new Date(),
        metadata: { importance: 0.5 },
      })
      memoryManager.addEntry({
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: formattedResponse,
        timestamp: new Date(),
        metadata: { importance: 0.5, model },
      })
    }

    return NextResponse.json({ completion: formattedResponse })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to process your request: ${message}` }, { status: 500 })
  }
}
