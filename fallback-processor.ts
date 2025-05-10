import { extractKeyEntities, analyzeTextComplexity } from "./clustering"

/**
 * Processes user input when external APIs are unavailable
 * Uses local embeddings and processing to maintain functionality
 */
export async function processWithLocalEmbeddings(input: string): Promise<string> {
  // Extract key entities and concepts
  const entities = extractKeyEntities(input)

  // Analyze complexity to determine appropriate response depth
  const complexity = analyzeTextComplexity(input)

  // Determine query intent
  const intent = identifyQueryIntent(input)

  // Generate response based on local knowledge
  return generateLocalResponse(input, entities, complexity, intent)
}

/**
 * Identifies the intent behind a user query
 */
function identifyQueryIntent(text: string): string {
  // Question detection
  if (
    text.includes("?") ||
    text.toLowerCase().startsWith("what") ||
    text.toLowerCase().startsWith("how") ||
    text.toLowerCase().startsWith("why") ||
    text.toLowerCase().startsWith("when") ||
    text.toLowerCase().startsWith("where") ||
    text.toLowerCase().startsWith("who") ||
    text.toLowerCase().startsWith("which")
  ) {
    return "QUESTION"
  }

  // Instruction detection
  if (
    text.toLowerCase().includes("explain") ||
    text.toLowerCase().includes("describe") ||
    text.toLowerCase().includes("tell me about")
  ) {
    return "EXPLANATION"
  }

  // How-to detection
  if (
    text.toLowerCase().includes("how to") ||
    text.toLowerCase().includes("steps to") ||
    text.toLowerCase().includes("guide")
  ) {
    return "INSTRUCTION"
  }

  // Comparison detection
  if (
    text.toLowerCase().includes("compare") ||
    text.toLowerCase().includes("difference between") ||
    text.toLowerCase().includes("versus") ||
    text.toLowerCase().includes(" vs ")
  ) {
    return "COMPARISON"
  }

  // Opinion detection
  if (
    text.toLowerCase().includes("opinion") ||
    text.toLowerCase().includes("think about") ||
    text.toLowerCase().includes("your thoughts")
  ) {
    return "OPINION"
  }

  // Simple statement/comment
  return "STATEMENT"
}

/**
 * Generates a response using local knowledge when APIs are unavailable
 */
function generateLocalResponse(
  input: string,
  entities: string[],
  complexity: { complexity: string; score: number },
  intent: string,
): string {
  // Basic knowledge base for common AI topics
  const knowledgeBase = {
    "artificial intelligence":
      "Artificial intelligence (AI) refers to systems or machines that mimic human intelligence to perform tasks and can iteratively improve themselves based on the information they collect.",
    "machine learning":
      "Machine learning is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed.",
    "neural network":
      "Neural networks are computing systems inspired by the human brain's biological neural networks, consisting of artificial neurons that process and transmit information.",
    "deep learning":
      "Deep learning is a subset of machine learning that uses neural networks with many layers (deep neural networks) to analyze various factors of data.",
    "natural language processing":
      "Natural language processing (NLP) is a field of AI that gives machines the ability to read, understand, and derive meaning from human languages.",
    transformer:
      "Transformers are a type of neural network architecture that uses self-attention mechanisms to process sequential data, revolutionizing NLP tasks.",
    "large language model":
      "Large Language Models (LLMs) are advanced AI systems trained on vast amounts of text data to understand and generate human-like text.",
    "reinforcement learning":
      "Reinforcement learning is a type of machine learning where an agent learns to make decisions by taking actions in an environment to maximize some notion of cumulative reward.",
    "computer vision":
      "Computer vision is a field of AI that enables computers to derive meaningful information from digital images, videos, and other visual inputs.",
    "generative ai":
      "Generative AI refers to AI systems that can create new content, including text, images, audio, and video, based on patterns learned from existing data.",
  }

  // Check if we have knowledge about any of the entities
  const relevantKnowledge = entities
    .map((entity) => {
      const key = Object.keys(knowledgeBase).find((k) => entity.toLowerCase().includes(k))
      return key ? knowledgeBase[key] : null
    })
    .filter(Boolean)

  // Generate appropriate response based on intent and available knowledge
  let response = ""

  switch (intent) {
    case "QUESTION":
      if (relevantKnowledge.length > 0) {
        response = `Based on my understanding, ${relevantKnowledge.join(" Furthermore, ")}`
      } else {
        response =
          "I understand you're asking a question. While I'm currently operating with limited connectivity to external knowledge sources, I can still assist with general information and reasoning. Could you provide more context or ask something within my core knowledge areas?"
      }
      break

    case "EXPLANATION":
      if (relevantKnowledge.length > 0) {
        response = `Let me explain: ${relevantKnowledge.join(" Additionally, ")}`
      } else {
        response =
          "I'd be happy to explain this topic. I'm currently operating with my core knowledge base without external connectivity. I can provide general insights, but may not have specialized information on this specific topic."
      }
      break

    case "INSTRUCTION":
      response =
        "I understand you're looking for instructions. While I'm operating with limited connectivity, I can still provide general guidance based on my core knowledge. However, for specialized or technical instructions, I recommend verifying with authoritative sources when connectivity is restored."
      break

    case "COMPARISON":
      if (relevantKnowledge.length >= 2) {
        response = `When comparing these concepts: ${relevantKnowledge.join(" On the other hand, ")}`
      } else {
        response =
          "I understand you're looking for a comparison. While I'm operating with limited connectivity, I can offer general distinctions based on my core knowledge, though I may not capture all the nuances of these concepts."
      }
      break

    case "OPINION":
      response =
        "I understand you're asking for an opinion. As an AI, I don't have personal opinions, but I can provide balanced perspectives based on my training data, even while operating with limited connectivity."
      break

    default:
      if (relevantKnowledge.length > 0) {
        response = `I can tell you that ${relevantKnowledge.join(" Also, ")}`
      } else {
        response =
          "I've received your message. I'm currently operating with limited connectivity to external knowledge sources, but I can still engage in conversation using my core capabilities. How can I assist you further?"
      }
  }

  // Adjust response complexity based on input complexity
  if (complexity.complexity === "high") {
    response +=
      "\n\nThis is a complex topic with many interconnected aspects. While I'm operating with limited connectivity, I can elaborate further on specific aspects if you'd like to explore any particular dimension in more depth."
  }

  return response
}

/**
 * Formats the response in plain text while maintaining advanced structure
 */
export function formatToPlainText(response: string): string {
  // Ensure proper paragraph breaks
  let formattedResponse = response.replace(/\n{3,}/g, "\n\n")

  // Ensure consistent sentence spacing
  formattedResponse = formattedResponse.replace(/\.\s+/g, ". ")

  // Ensure proper list formatting if present
  if (formattedResponse.includes("- ")) {
    formattedResponse = formattedResponse.replace(/- /g, "\n- ")
  }

  // Ensure proper numbered list formatting if present
  if (/\d+\.\s/.test(formattedResponse)) {
    formattedResponse = formattedResponse.replace(/(\d+)\.\s/g, "\n$1. ")
  }

  return formattedResponse.trim()
}

