import { extractKeyEntities } from "./text-analysis"

/**
 * Preprocesses user messages to enhance AI understanding
 * Applies NLP techniques, entity recognition, and contextual analysis
 */
export async function preprocessUserMessage(message: string): Promise<string> {
  // Basic preprocessing
  let processedMessage = message.trim()

  // Remove excessive whitespace
  processedMessage = processedMessage.replace(/\s+/g, " ")

  // Identify query intent for better understanding
  const intent = identifyQueryIntent(processedMessage)
  if (intent) {
    processedMessage = `[${intent}] ${processedMessage}`
  }

  // Extract potential entities for enhanced understanding
  const entities = extractKeyEntities(processedMessage)
  if (entities.length > 0) {
    processedMessage = `${processedMessage}\n[ENTITIES] ${entities.join(", ")}`
  }

  // Analyze sentiment
  const sentiment = analyzeSentiment(processedMessage)
  if (sentiment !== "neutral") {
    processedMessage = `${processedMessage}\n[SENTIMENT] ${sentiment}`
  }

  // Extract key topics
  const topics = extractKeyTopics(processedMessage)
  if (topics.length > 0) {
    processedMessage = `${processedMessage}\n[TOPICS] ${topics.join(", ")}`
  }

  // Detect complexity level
  const complexity = detectComplexity(processedMessage)
  processedMessage = `${processedMessage}\n[COMPLEXITY] ${complexity}`

  return processedMessage
}

/**
 * Identifies the intent behind a user query
 */
function identifyQueryIntent(text: string): string | null {
  // Question detection
  if (
    text.includes("?") ||
    text.toLowerCase().startsWith("what") ||
    text.toLowerCase().startsWith("how") ||
    text.toLowerCase().startsWith("why") ||
    text.toLowerCase().startsWith("when") ||
    text.toLowerCase().startsWith("where") ||
    text.toLowerCase().startsWith("who") ||
    text.toLowerCase().startsWith("which") ||
    text.toLowerCase().startsWith("can") ||
    text.toLowerCase().startsWith("could") ||
    text.toLowerCase().startsWith("would") ||
    text.toLowerCase().startsWith("is") ||
    text.toLowerCase().startsWith("are") ||
    text.toLowerCase().startsWith("do") ||
    text.toLowerCase().startsWith("does")
  ) {
    // Detect question subtypes
    if (
      text.toLowerCase().includes("difference between") ||
      text.toLowerCase().includes("compare") ||
      text.toLowerCase().includes("versus") ||
      text.toLowerCase().includes(" vs ")
    ) {
      return "COMPARISON_QUESTION"
    }

    if (
      text.toLowerCase().includes("why") ||
      text.toLowerCase().includes("reason") ||
      text.toLowerCase().includes("cause")
    ) {
      return "CAUSAL_QUESTION"
    }

    if (
      text.toLowerCase().includes("how to") ||
      text.toLowerCase().includes("steps") ||
      text.toLowerCase().includes("process") ||
      text.toLowerCase().includes("procedure")
    ) {
      return "PROCEDURAL_QUESTION"
    }

    if (
      text.toLowerCase().includes("define") ||
      text.toLowerCase().includes("what is") ||
      text.toLowerCase().includes("what are") ||
      text.toLowerCase().includes("meaning of")
    ) {
      return "DEFINITIONAL_QUESTION"
    }

    if (
      text.toLowerCase().includes("example") ||
      text.toLowerCase().includes("instance") ||
      text.toLowerCase().includes("illustration")
    ) {
      return "EXAMPLE_REQUEST"
    }

    return "GENERAL_QUESTION"
  }

  // Instruction detection
  if (
    text.toLowerCase().includes("explain") ||
    text.toLowerCase().includes("describe") ||
    text.toLowerCase().includes("tell me about") ||
    text.toLowerCase().includes("what is")
  ) {
    return "EXPLANATION_REQUEST"
  }

  // How-to detection
  if (
    text.toLowerCase().includes("how to") ||
    text.toLowerCase().includes("steps to") ||
    text.toLowerCase().includes("guide") ||
    text.toLowerCase().includes("tutorial") ||
    text.toLowerCase().includes("instructions")
  ) {
    return "INSTRUCTION_REQUEST"
  }

  // Comparison detection
  if (
    text.toLowerCase().includes("compare") ||
    text.toLowerCase().includes("difference between") ||
    text.toLowerCase().includes("versus") ||
    text.toLowerCase().includes(" vs ") ||
    text.toLowerCase().includes("similarities") ||
    text.toLowerCase().includes("differences")
  ) {
    return "COMPARISON_REQUEST"
  }

  // Opinion detection
  if (
    text.toLowerCase().includes("opinion") ||
    text.toLowerCase().includes("think about") ||
    text.toLowerCase().includes("your thoughts") ||
    text.toLowerCase().includes("do you believe") ||
    text.toLowerCase().includes("what do you think") ||
    text.toLowerCase().includes("perspective on")
  ) {
    return "OPINION_REQUEST"
  }

  // Brainstorming detection
  if (
    text.toLowerCase().includes("brainstorm") ||
    text.toLowerCase().includes("ideas for") ||
    text.toLowerCase().includes("suggestions for") ||
    text.toLowerCase().includes("ways to") ||
    text.toLowerCase().includes("possibilities") ||
    text.toLowerCase().includes("alternatives") ||
    text.toLowerCase().includes("options")
  ) {
    return "BRAINSTORMING_REQUEST"
  }

  // Summarization detection
  if (
    text.toLowerCase().includes("summarize") ||
    text.toLowerCase().includes("summary of") ||
    text.toLowerCase().includes("tldr") ||
    text.toLowerCase().includes("in brief") ||
    text.toLowerCase().includes("key points") ||
    text.toLowerCase().includes("main ideas")
  ) {
    return "SUMMARIZATION_REQUEST"
  }

  // Analysis detection
  if (
    text.toLowerCase().includes("analyze") ||
    text.toLowerCase().includes("analysis") ||
    text.toLowerCase().includes("evaluate") ||
    text.toLowerCase().includes("assessment") ||
    text.toLowerCase().includes("critique") ||
    text.toLowerCase().includes("review")
  ) {
    return "ANALYSIS_REQUEST"
  }

  // Simple statement/comment
  return "STATEMENT"
}

/**
 * Analyzes sentiment of text
 */
function analyzeSentiment(text: string): string {
  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "wonderful",
    "fantastic",
    "brilliant",
    "outstanding",
    "superb",
    "terrific",
    "awesome",
    "positive",
    "helpful",
    "useful",
    "valuable",
    "beneficial",
    "impressive",
    "exceptional",
    "remarkable",
    "extraordinary",
    "love",
    "like",
    "enjoy",
    "appreciate",
    "happy",
    "pleased",
    "satisfied",
    "delighted",
    "grateful",
    "thankful",
    "excited",
  ]

  const negativeWords = [
    "bad",
    "poor",
    "terrible",
    "awful",
    "horrible",
    "dreadful",
    "disappointing",
    "frustrating",
    "annoying",
    "irritating",
    "useless",
    "worthless",
    "inadequate",
    "inferior",
    "mediocre",
    "subpar",
    "hate",
    "dislike",
    "despise",
    "detest",
    "loathe",
    "abhor",
    "angry",
    "upset",
    "sad",
    "unhappy",
    "disappointed",
    "frustrated",
    "confused",
    "worried",
    "concerned",
    "anxious",
    "stressed",
  ]

  let positiveScore = 0
  let negativeScore = 0

  const words = text.toLowerCase().split(/\W+/)

  words.forEach((word) => {
    if (positiveWords.includes(word)) positiveScore++
    if (negativeWords.includes(word)) negativeScore++
  })

  // Check for negation patterns that could reverse sentiment
  const negationWords = [
    "not",
    "no",
    "never",
    "neither",
    "nor",
    "hardly",
    "barely",
    "scarcely",
    "doesn't",
    "don't",
    "didn't",
    "isn't",
    "aren't",
    "wasn't",
    "weren't",
  ]

  // Simple negation handling - check if positive words are preceded by negation
  for (let i = 1; i < words.length; i++) {
    if (positiveWords.includes(words[i]) && negationWords.includes(words[i - 1])) {
      positiveScore--
      negativeScore++
    }
    if (negativeWords.includes(words[i]) && negationWords.includes(words[i - 1])) {
      negativeScore--
      positiveScore++
    }
  }

  if (positiveScore > negativeScore * 1.5) return "positive"
  if (negativeScore > positiveScore * 1.5) return "negative"
  return "neutral"
}

/**
 * Extract key topics from text
 */
function extractKeyTopics(text: string): string[] {
  // Expanded list of common topics
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

  const topics = []
  const lowerText = text.toLowerCase()

  // First pass: direct matches
  for (const topic of commonTopics) {
    if (lowerText.includes(topic)) {
      topics.push(topic)
    }
  }

  // Second pass: partial matches for multi-word topics
  if (topics.length < 3) {
    const remainingTopics = commonTopics.filter((topic) => !topics.includes(topic) && topic.includes(" "))

    for (const topic of remainingTopics) {
      const parts = topic.split(" ")
      // Check if at least 2 parts of the multi-word topic are present
      const matchCount = parts.filter((part) => lowerText.includes(part)).length

      if (matchCount >= 2 && !topics.includes(topic)) {
        topics.push(topic)
      }

      if (topics.length >= 5) break
    }
  }

  return topics.slice(0, 3) // Return top 3 topics
}

/**
 * Detects the complexity level of the user's query
 */
function detectComplexity(text: string): string {
  // Count words
  const words = text.split(/\s+/).filter(Boolean)

  // Count entities and technical terms
  const entities = extractKeyEntities(text)

  // Check for complex question patterns
  const hasComplexPatterns =
    /\b(relationship between|compare and contrast|analyze|synthesize|evaluate|what if|hypothetically|theoretically|implications of|consequences of)\b/i.test(
      text,
    )

  // Check for multi-part questions
  const hasMultipleParts = text.includes("?") && text.split("?").filter(Boolean).length > 1

  if ((words.length > 30 && entities.length > 3) || hasComplexPatterns || hasMultipleParts) {
    return "high"
  } else if (words.length > 15 || entities.length > 1) {
    return "medium"
  } else {
    return "low"
  }
}

