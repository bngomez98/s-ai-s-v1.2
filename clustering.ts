/**
 * Simple text similarity function using Jaccard similarity
 * In a production environment, this would use more sophisticated NLP techniques
 */
function calculateSimilarity(text1: string, text2: string): number {
  // Convert to lowercase and tokenize
  const tokens1 = new Set(
    text1
      .toLowerCase()
      .split(/\W+/)
      .filter((token) => token.length > 2),
  )
  const tokens2 = new Set(
    text2
      .toLowerCase()
      .split(/\W+/)
      .filter((token) => token.length > 2),
  )

  // Calculate intersection
  const intersection = new Set([...tokens1].filter((token) => tokens2.has(token)))

  // Calculate union
  const union = new Set([...tokens1, ...tokens2])

  // Return Jaccard similarity
  return intersection.size / union.size
}

/**
 * Extracts the main topic from a message
 */
function extractMainTopic(message: string): string {
  // Simple implementation - in a production environment, this would use more sophisticated NLP
  const commonTopics = [
    "artificial intelligence",
    "machine learning",
    "neural networks",
    "data science",
    "programming",
    "technology",
    "science",
    "business",
    "health",
    "education",
    "research",
    "development",
    "computer vision",
    "natural language processing",
    "robotics",
    "deep learning",
    "reinforcement learning",
    "generative AI",
    "large language models",
    "transformers",
    "vector databases",
    "retrieval augmented generation",
    "fine-tuning",
    "transfer learning",
  ]

  const lowerMessage = message.toLowerCase()

  // Find the first topic that appears in the message
  for (const topic of commonTopics) {
    if (lowerMessage.includes(topic)) {
      return topic
    }
  }

  // If no common topic is found, extract the first few words
  const words = message.split(/\s+/)
  return words.slice(0, 3).join(" ") + "..."
}

/**
 * Clusters similar messages together
 */
export async function clusterSimilarMessages(messages: string[]): Promise<Record<string, string[]>> {
  const clusters: Record<string, string[]> = {}
  const similarityThreshold = 0.3 // Adjust as needed

  // Process each message
  for (const message of messages) {
    let assigned = false

    // Check if the message is similar to any existing cluster
    for (const [topic, clusterMessages] of Object.entries(clusters)) {
      // Check similarity with the first message in the cluster
      if (calculateSimilarity(message, clusterMessages[0]) > similarityThreshold) {
        clusters[topic].push(message)
        assigned = true
        break
      }
    }

    // If not similar to any existing cluster, create a new one
    if (!assigned) {
      const topic = extractMainTopic(message)
      clusters[topic] = [message]
    }
  }

  return clusters
}

/**
 * Identifies key entities in a text
 */
export function extractKeyEntities(text: string): string[] {
  // Simple implementation - in a production environment, this would use NER models
  const entities: string[] = []

  // Patterns for common entity types
  const patterns = [
    // Technology terms
    /\b(blockchain|cryptocurrency|bitcoin|ethereum|AI|ML|neural network|deep learning|computer vision|NLP|RAG|DNL|transformer|GPT|BERT|LLM|CNN|RNN|LSTM|GAN)\b/gi,
    // Organizations
    /\b(Google|Microsoft|Apple|Amazon|Facebook|Meta|OpenAI|Anthropic|Tesla|IBM|Intel|NVIDIA|AMD|Samsung|Huawei|Baidu|Tencent|Alibaba)\b/g,
    // Programming languages
    /\b(JavaScript|Python|Java|C\+\+|Ruby|Go|Rust|TypeScript|PHP|Swift|Kotlin|Scala|R|Julia|Haskell|Perl|C#|Dart)\b/g,
  ]

  // Extract matches from each pattern
  patterns.forEach((pattern) => {
    const matches = text.match(pattern)
    if (matches) {
      entities.push(...matches)
    }
  })

  // Remove duplicates and return
  return [...new Set(entities.map((e) => e.toLowerCase()))]
}

/**
 * Analyzes the complexity of a text
 */
export function analyzeTextComplexity(text: string): { complexity: "simple" | "moderate" | "complex"; score: number } {
  // Count words
  const words = text.split(/\s+/).filter((word) => word.length > 0)
  const wordCount = words.length

  // Count sentences
  const sentences = text.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 0)
  const sentenceCount = sentences.length

  // Calculate average words per sentence
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0

  // Count complex words (words with 3+ syllables)
  const complexWords = words.filter((word) => countSyllables(word) >= 3)
  const complexWordCount = complexWords.length

  // Calculate percentage of complex words
  const complexWordPercentage = wordCount > 0 ? (complexWordCount / wordCount) * 100 : 0

  // Calculate complexity score (based on Flesch-Kincaid readability)
  const score = 0.39 * avgWordsPerSentence + 11.8 * (complexWordCount / wordCount) - 15.59

  // Determine complexity level
  let complexity: "simple" | "moderate" | "complex"
  if (score < 30) {
    complexity = "simple"
  } else if (score < 50) {
    complexity = "moderate"
  } else {
    complexity = "complex"
  }

  return { complexity, score }
}

/**
 * Simple syllable counter
 */
function countSyllables(word: string): number {
  word = word.toLowerCase()

  // Remove non-alphabetic characters
  word = word.replace(/[^a-z]/g, "")

  // Special cases
  if (word.length <= 3) return 1

  // Count vowel groups
  const vowels = ["a", "e", "i", "o", "u", "y"]
  let count = 0
  let prevIsVowel = false

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i])
    if (isVowel && !prevIsVowel) {
      count++
    }
    prevIsVowel = isVowel
  }

  // Adjust for silent 'e' at the end
  if (word.endsWith("e")) {
    count--
  }

  // Ensure at least one syllable
  return Math.max(1, count)
}

