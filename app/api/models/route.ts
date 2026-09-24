import { NextResponse } from "next/server"
import { getChatService } from "@/lib/ai/container"

export async function GET() {
  return NextResponse.json({ models: await getChatService().listModels() })
}
