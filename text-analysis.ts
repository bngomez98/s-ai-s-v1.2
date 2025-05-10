/**
 * Enhanced entity extraction function
 */
export function extractKeyEntities(text: string): string[] {
  const entities: string[] = []

  // Expanded regex patterns for common entity types
  const patterns = [
    // Technology terms
    /\b(blockchain|cryptocurrency|bitcoin|ethereum|AI|ML|neural network|deep learning|computer vision|NLP|RAG|DNL|transformer|GPT|BERT|LLM|CNN|RNN|LSTM|GAN)\b/gi,
    // Organizations
    /\b(Google|Microsoft|Apple|Amazon|Facebook|Meta|OpenAI|Anthropic|Tesla|IBM|Intel|NVIDIA|AMD|Samsung|Huawei|Baidu|Tencent|Alibaba)\b/g,
    // Programming languages
    /\b(JavaScript|Python|Java|C\+\+|Ruby|Go|Rust|TypeScript|PHP|Swift|Kotlin|Scala|R|Julia|Haskell|Perl|C#|Dart)\b/g,
    // Frameworks and libraries
    /\b(React|Angular|Vue|Next\.js|Node\.js|Django|Flask|TensorFlow|PyTorch|Keras|scikit-learn|pandas|NumPy|Matplotlib|Express|Spring|Laravel|Rails)\b/g,
    // Cloud services
    /\b(AWS|Azure|Google Cloud|GCP|Heroku|Vercel|Netlify|DigitalOcean|Cloudflare|Firebase|Supabase)\b/g,
    // Database technologies
    /\b(SQL|NoSQL|MongoDB|PostgreSQL|MySQL|SQLite|Redis|Cassandra|DynamoDB|Elasticsearch|Neo4j|GraphQL)\b/g,
    // AI concepts
    /\b(supervised learning|unsupervised learning|reinforcement learning|classification|regression|clustering|NLP|computer vision|neural network|deep learning|machine learning|artificial intelligence|generative AI|large language model|embedding|vector database|fine-tuning|transfer learning)\b/gi,
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
 * Count syllables in a word (simplified approach)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase()

  // Remove non-alphabetic characters
  word = word.replace(/[^a-z]/g, "")

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

  // Adjust for common patterns
  if (word.endsWith("e")) count--
  if (word.endsWith("le") && word.length > 2 && !vowels.includes(word[word.length - 3])) count++
  if (word.endsWith("es") || word.endsWith("ed")) count--

  // Ensure at least one syllable
  return Math.max(1, count)
}

