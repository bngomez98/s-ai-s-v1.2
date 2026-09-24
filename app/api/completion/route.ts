import { NextResponse } from "next/server"
import { preprocessUserMessage } from "@/message-processor"
import { formatToPlainText } from "@/fallback-processor"
import { getMemoryManager } from "@/memory-manager"
import { getChatService } from "@/lib/ai/container"
import type { ChatMessage, CompletionOptions } from "@/lib/ai/domain"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!Array.isArray(body.messages)) {
      return NextResponse.json({ error: "messages must be an array" }, { status: 400 })
    }

    const messages = body.messages as ChatMessage[]
    const lastUser = [...messages].reverse().find((message) => message.role === "user")
    if (!lastUser || typeof lastUser.content !== "string") {
      return NextResponse.json({ error: "A text user message is required" }, { status: 400 })
    }

    const processed = await preprocessUserMessage(lastUser.content)
    const memoryManager = getMemoryManager()
    const memories = memoryManager.getRelatedMemories(processed, 3)
    const context = memories.map((memory) => ({
      role: "system" as const,
      content: `Relevant context: ${memory.content}`,
    }))

    const providerMessages: ChatMessage[] = [
      ...context,
      ...messages.map((message) => (message === lastUser ? { ...message, content: processed } : message)),
    ]

    const options: CompletionOptions = {
      model: typeof body.model === "string" ? body.model : undefined,
      temperature: typeof body.temperature === "number" ? body.temperature : undefined,
      top_p: typeof body.top_p === "number" ? body.top_p : undefined,
      max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : undefined,
      stop: Array.isArray(body.stop)
        ? body.stop.filter((item: unknown): item is string => typeof item === "string")
        : undefined,
    }

    const result = await getChatService().complete(providerMessages, options)
    const completion = formatToPlainText(result.text)

    memoryManager.addEntry({
      id: `user-${Date.now()}`,
      role: "user",
      content: processed,
      timestamp: new Date(),
      metadata: { importance: 0.5 },
    })

    memoryManager.addEntry({
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: completion,
      timestamp: new Date(),
      metadata: { importance: 0.5, model: result.model },
    })

    return NextResponse.json({ completion, model: result.model, usage: result.usage })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    const status = message.includes("TOGETHER_API_KEY") ? 503 : 500
    return NextResponse.json({ error: message, needsApiKey: status === 503 }, { status })
  }
}
