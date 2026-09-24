import { NextResponse } from "next/server"
import { z } from "zod"
import { preprocessUserMessage } from "@/message-processor"
import { formatToPlainText } from "@/fallback-processor"
import { getMemoryManager } from "@/memory-manager"
import { getChatService } from "@/lib/ai/container"
import type { ChatMessage, CompletionOptions } from "@/lib/ai/domain"

export const maxDuration = 30

const imagePartSchema = z.object({
  type: z.literal("image_url"),
  image_url: z.object({ url: z.string().url(), detail: z.enum(["auto", "low", "high"]).optional() }),
})
const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.union([z.string().min(1).max(100_000), z.array(z.union([z.object({ type: z.literal("text"), text: z.string().max(100_000) }), imagePartSchema])).min(1)]),
})
const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(100),
  model: z.string().trim().min(1).max(200).optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  max_tokens: z.number().int().min(1).max(16_384).optional(),
  stop: z.array(z.string().max(100)).max(4).optional(),
})

export async function POST(req: Request) {
  try {
    const parsed = requestSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: "Invalid completion request" }, { status: 400 })

    const { messages, ...requestOptions } = parsed.data
    const lastUserIndex = [...messages].map((message) => message.role).lastIndexOf("user")
    if (lastUserIndex < 0 || typeof messages[lastUserIndex].content !== "string") {
      return NextResponse.json({ error: "A text user message is required" }, { status: 400 })
    }

    const processed = await preprocessUserMessage(messages[lastUserIndex].content)
    const memoryManager = getMemoryManager()
    const context = memoryManager.getRelatedMemories(processed, 3).map((memory) => ({
      role: "system" as const,
      content: `Relevant context: ${memory.content}`,
    }))
    const providerMessages: ChatMessage[] = [...context, ...messages.map((message, index) => index === lastUserIndex ? { ...message, content: processed } : message)]
    const result = await getChatService().complete(providerMessages, requestOptions as CompletionOptions)
    const completion = formatToPlainText(result.text)

    memoryManager.addEntry({ id: `user-${Date.now()}`, role: "user", content: processed, timestamp: new Date(), metadata: { importance: 0.5 } })
    memoryManager.addEntry({ id: `assistant-${Date.now()}`, role: "assistant", content: completion, timestamp: new Date(), metadata: { importance: 0.5, model: result.model } })
    return NextResponse.json({ completion, model: result.model, usage: result.usage })
  } catch (error) {
    console.error("Completion request failed", error)
    const message = error instanceof Error ? error.message : "Completion failed"
    const configurationError = /not configured/i.test(message)
    return NextResponse.json({ error: configurationError ? "AI service is not configured" : "AI service temporarily unavailable", ...(configurationError ? { needsConfiguration: true } : {}) }, { status: configurationError ? 503 : 502 })
  }
}
