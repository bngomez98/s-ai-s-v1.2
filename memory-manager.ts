export interface MemoryEntry {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  metadata?: {
    topics?: string[]
    importance?: number
    [key: string]: any
  }
}

class MemoryManager {
  private entries: MemoryEntry[] = []
  private maxEntries: number

  constructor(maxEntries = 100) {
    this.maxEntries = maxEntries
  }

  public addEntry(entry: MemoryEntry): void {
    this.entries.push(entry)

    // Manage memory size
    if (this.entries.length > this.maxEntries) {
      // Sort by importance (if available) or default to FIFO
      this.entries.sort((a, b) => {
        const importanceA = a.metadata?.importance || 0
        const importanceB = b.metadata?.importance || 0
        return importanceA - importanceB
      })

      // Remove least important entry
      this.entries.shift()
    }
  }

  public getEntries(options?: {
    limit?: number
    role?: string
    topics?: string[]
    timeRange?: { start?: Date; end?: Date }
    sortBy?: "time" | "importance"
  }): MemoryEntry[] {
    let filteredEntries = [...this.entries]

    // Apply filters
    if (options?.role) {
      filteredEntries = filteredEntries.filter((entry) => entry.role === options.role)
    }

    if (options?.topics && options.topics.length > 0) {
      filteredEntries = filteredEntries.filter((entry) => {
        const entryTopics = entry.metadata?.topics || []
        return options.topics!.some((topic) => entryTopics.includes(topic))
      })
    }

    if (options?.timeRange) {
      if (options.timeRange.start) {
        filteredEntries = filteredEntries.filter((entry) => entry.timestamp >= options.timeRange!.start!)
      }
      if (options.timeRange.end) {
        filteredEntries = filteredEntries.filter((entry) => entry.timestamp <= options.timeRange!.end!)
      }
    }

    // Apply sorting
    if (options?.sortBy === "importance") {
      filteredEntries.sort((a, b) => {
        const importanceA = a.metadata?.importance || 0
        const importanceB = b.metadata?.importance || 0
        return importanceB - importanceA // Higher importance first
      })
    } else {
      // Default to time-based sorting (newest first)
      filteredEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    }

    // Apply limit
    if (options?.limit && options.limit > 0) {
      filteredEntries = filteredEntries.slice(0, options.limit)
    }

    return filteredEntries
  }

  public getRelatedMemories(query: string, limit = 5): MemoryEntry[] {
    // Simple keyword-based relevance for now
    // In a production system, this would use vector embeddings and semantic search
    const queryWords = query
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3)

    // Score entries based on keyword matches
    const scoredEntries = this.entries.map((entry) => {
      const content = entry.content.toLowerCase()
      let score = 0

      // Count matching keywords
      for (const word of queryWords) {
        if (content.includes(word)) {
          score += 1
        }
      }

      // Boost score based on importance
      if (entry.metadata?.importance) {
        score *= 1 + entry.metadata.importance
      }

      return { entry, score }
    })

    // Sort by score (highest first) and take top N
    return scoredEntries
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .filter((item) => item.score > 0) // Only return relevant entries
      .map((item) => item.entry)
  }

  public clear(): void {
    this.entries = []
  }
}

// Singleton instance
let memoryManagerInstance: MemoryManager | null = null

export function getMemoryManager(): MemoryManager {
  if (!memoryManagerInstance) {
    memoryManagerInstance = new MemoryManager()
  }
  return memoryManagerInstance
}

