import type { MemoryEntry } from "@/lib/memory-manager"

const HF_API = "https://datasets-server.huggingface.co/rows"
const DATASET = "stanfordnlp/coqa"
const CONFIG = "default"
const SPLIT = "train"

export interface CoQARow {
  id: string
  paragraph: string
  questions: string[]
  answers: {
    input_text: string
    answer_start: number
  }[]
  story: string
}

export async function queryCoQA(offset = 0, length = 1): Promise<CoQARow[]> {
  const query = new URLSearchParams({
    dataset: DATASET,
    config: CONFIG,
    split: SPLIT,
    offset: offset.toString(),
    length: length.toString(),
  })

  try {
    const res = await fetch(`${HF_API}?${query.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Failed to query CoQA: ${res.status} - ${errText}`)
    }

    const json = await res.json()
    if (!Array.isArray(json.rows)) throw new Error("Malformed CoQA dataset response")

    return json.rows.map((row: { row: CoQARow }) => row.row)
  } catch (error) {
    console.error("Error querying CoQA dataset:", error)
    // Return empty array instead of throwing to prevent breaking the application
    return []
  }
}

export function formatCoQARowAsMemory(row: CoQARow): MemoryEntry[] {
  const now = Date.now()
  const entries: MemoryEntry[] = []

  // Optional system context
  entries.push({
    id: `${row.id}-context`,
    role: "system",
    content: `Context for reasoning:\n${row.story}`,
    timestamp: new Date(now - 5000),
    metadata: {
      topics: ["coqa", "story", "contextualization"],
      importance: 0.3,
    },
  })

  for (let i = 0; i < row.questions.length; i++) {
    const question = row.questions[i]
    const answer = row.answers[i]?.input_text

    if (!question || !answer) continue

    entries.push(
      {
        id: `${row.id}-q-${i}`,
        role: "user",
        content: question,
        timestamp: new Date(now + i * 1000),
        metadata: {
          topics: ["qa", "coqa", "dialogue"],
          importance: 0.5,
        },
      },
      {
        id: `${row.id}-a-${i}`,
        role: "assistant",
        content: answer,
        timestamp: new Date(now + i * 1000 + 500),
        metadata: {
          topics: ["qa", "coqa", "reasoning"],
          importance: 0.6,
        },
      },
    )
  }

  return entries
}

