"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

type Message = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: Date
  model?: string
}

type Conversation = {
  id: string
  title?: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  metadata?: {
    topics?: string[]
    sentiment?: string
    entities?: string[]
    keyInsights?: string[]
    summary?: string
  }
}

type Settings = {
  temperature: number
  maxTokens: number
  advancedReasoning: boolean
  contextRetention: boolean
  technicalPrecision?: boolean
  creativeMode?: boolean
  longTermMemory?: boolean
  adaptiveLearning?: boolean
  memoryDepth?: number
}

type ConversationContextType = {
  conversations: Conversation[]
  currentConversationId: string | null
  messages: Message[]
  settings: Settings
  isProcessing: boolean
  startNewConversation: () => void
  loadConversation: (id: string) => void
  addMessage: (message: Message) => void
  saveConversation: (title?: string) => void
  deleteConversation: (id: string) => void
  clearCurrentConversation: () => void
  updateSettings: (newSettings: Partial<Settings>) => void
  getConversationHistory: () => { role: string; content: string }[]
  analyzeConversation: (conversationId: string) => void
  getConversationSummary: (conversationId: string) => string
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined)

const DEFAULT_SETTINGS: Settings = {
  temperature: 0.7,
  maxTokens: 2000,
  advancedReasoning: true,
  contextRetention: true,
  technicalPrecision: true,
  creativeMode: false,
  longTermMemory: true,
  adaptiveLearning: true,
  memoryDepth: 10,
}

// Helper function to extract key topics from a conversation
const extractTopics = (messages: Message[]): string[] => {
  // Simple implementation - in a real app, this would use NLP
  const userMessages = messages.filter((m) => m.role === "user").map((m) => m.content.toLowerCase())

  const commonTopics = [
    "ai",
    "machine learning",
    "neural networks",
    "data",
    "programming",
    "technology",
    "science",
    "math",
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
    "generative ai",
    "large language models",
    "transformers",
    "vector databases",
    "retrieval augmented generation",
    "fine-tuning",
    "transfer learning",
  ]

  return commonTopics.filter((topic) => userMessages.some((msg) => msg.includes(topic))).slice(0, 3)
}

// Helper function to analyze sentiment
const analyzeSentiment = (messages: Message[]): string => {
  // Simple implementation - in a real app, this would use sentiment analysis
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

  const userMessages = messages.filter((m) => m.role === "user").map((m) => m.content.toLowerCase())

  let positiveCount = 0
  let negativeCount = 0

  userMessages.forEach((msg) => {
    positiveWords.forEach((word) => {
      if (msg.includes(word)) positiveCount++
    })
    negativeWords.forEach((word) => {
      if (msg.includes(word)) negativeCount++
    })
  })

  if (positiveCount > negativeCount * 1.5) return "positive"
  if (negativeCount > positiveCount * 1.5) return "negative"
  return "neutral"
}

// Helper function to extract entities
const extractEntities = (messages: Message[]): string[] => {
  const entities: string[] = []

  // Expanded regex patterns for common entity types
  const patterns = [
    // Technology terms
    /\b(blockchain|cryptocurrency|bitcoin|ethereum|AI|ML|neural network|deep learning|computer vision|NLP|RAG|DNL|transformer|GPT|BERT|LLM|CNN|RNN|LSTM|GAN)\b/gi,
    // Organizations
    /\b(Google|Microsoft|Apple|Amazon|Facebook|Meta|OpenAI|Anthropic|Tesla|IBM|Intel|NVIDIA|AMD|Samsung|Huawei|Baidu|Tencent|Alibaba)\b/g,
    // Programming languages
    /\b(JavaScript|Python|Java|C\+\+|Ruby|Go|Rust|TypeScript|PHP|Swift|Kotlin|Scala|R|Julia|Haskell|Perl|C#|Dart)\b/g,
  ]

  messages.forEach((message) => {
    if (message.role === "user") {
      const content = message.content.toLowerCase()

      patterns.forEach((pattern) => {
        const matches = content.match(pattern)
        if (matches) {
          entities.push(...matches)
        }
      })
    }
  })

  // Remove duplicates and return
  return [...new Set(entities.map((e) => e.toLowerCase()))].slice(0, 10)
}

// Helper function to generate a conversation summary
const generateConversationSummary = (messages: Message[]): string => {
  if (messages.length === 0) return "No conversation data"

  // Get the first user message as a starting point
  const firstUserMessage = messages.find((m) => m.role === "user")
  if (!firstUserMessage) return "No user messages in conversation"

  // Extract topics
  const topics = extractTopics(messages)
  const topicsText = topics.length > 0 ? `Topics discussed: ${topics.join(", ")}` : ""

  // Count messages
  const userMessageCount = messages.filter((m) => m.role === "user").length
  const aiMessageCount = messages.filter((m) => m.role === "assistant").length

  // Generate summary
  return `Conversation with ${userMessageCount} user messages and ${aiMessageCount} AI responses. ${topicsText}`
}

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isProcessing, setIsProcessing] = useState(false)

  // Load conversations from localStorage on initial render
  useEffect(() => {
    const storedConversations = localStorage.getItem("conversations")
    if (storedConversations) {
      try {
        const parsedConversations = JSON.parse(storedConversations)
        setConversations(parsedConversations)
      } catch (error) {
        console.error("Failed to parse stored conversations:", error)
      }
    }

    const storedSettings = localStorage.getItem("aiSettings")
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings)
        setSettings(parsedSettings)
      } catch (error) {
        console.error("Failed to parse stored settings:", error)
      }
    }
  }, [])

  // Start a new conversation
  const startNewConversation = () => {
    setCurrentConversationId(null)
    setMessages([])
  }

  // Load a conversation
  const loadConversation = (id: string) => {
    const conversation = conversations.find((c) => c.id === id)
    if (conversation) {
      setCurrentConversationId(id)
      setMessages(conversation.messages)
    }
  }

  // Get conversation history for context
  const getConversationHistory = () => {
    // Return the last N messages (or fewer if there aren't that many)
    // Format them for the API
    const historyLimit = settings.memoryDepth || 10
    const recentMessages = messages.slice(-historyLimit)

    return recentMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))
  }

  // Add a message to the current conversation
  const addMessage = (message: Message) => {
    setIsProcessing(true)
    setMessages((prev) => [...prev, message])

    // If this is a user message and there's no current conversation, create one
    if (message.role === "user" && !currentConversationId) {
      const newId = Date.now().toString()
      setCurrentConversationId(newId)

      // Create a new conversation
      const newConversation: Conversation = {
        id: newId,
        messages: [message],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setConversations((prev) => [newConversation, ...prev])

      // Save to localStorage
      localStorage.setItem("conversations", JSON.stringify([newConversation, ...conversations]))
    } else if (currentConversationId) {
      // Update existing conversation
      const updatedConversations = conversations.map((conv) => {
        if (conv.id === currentConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, message],
            updatedAt: new Date(),
          }
        }
        return conv
      })

      setConversations(updatedConversations)

      // Save to localStorage
      localStorage.setItem("conversations", JSON.stringify(updatedConversations))
    }

    setIsProcessing(false)
  }

  // Analyze conversation to extract metadata
  const analyzeConversation = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId)
    if (!conversation) return

    // Extract topics, sentiment, and other metadata
    const topics = extractTopics(conversation.messages)
    const sentiment = analyzeSentiment(conversation.messages)
    const entities = extractEntities(conversation.messages)
    const summary = generateConversationSummary(conversation.messages)

    // Update the conversation with metadata
    const updatedConversations = conversations.map((conv) => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          metadata: {
            ...conv.metadata,
            topics,
            sentiment,
            entities,
            summary,
          },
        }
      }
      return conv
    })

    setConversations(updatedConversations)
    localStorage.setItem("conversations", JSON.stringify(updatedConversations))
  }

  // Get conversation summary
  const getConversationSummary = (conversationId: string): string => {
    const conversation = conversations.find((c) => c.id === conversationId)
    if (!conversation) return "Conversation not found"

    if (conversation.metadata?.summary) {
      return conversation.metadata.summary
    }

    // Generate a summary if one doesn't exist
    return generateConversationSummary(conversation.messages)
  }

  // Save the current conversation
  const saveConversation = (title?: string) => {
    if (!currentConversationId || messages.length === 0) return

    const updatedConversations = conversations.map((conv) => {
      if (conv.id === currentConversationId) {
        const updatedConv = {
          ...conv,
          title: title || conv.title,
          messages,
          updatedAt: new Date(),
        }

        // If we have enough messages, analyze the conversation
        if (messages.length >= 3) {
          const topics = extractTopics(messages)
          const sentiment = analyzeSentiment(messages)
          const entities = extractEntities(messages)
          const summary = generateConversationSummary(messages)

          updatedConv.metadata = {
            ...updatedConv.metadata,
            topics,
            sentiment,
            entities,
            summary,
          }
        }

        return updatedConv
      }
      return conv
    })

    setConversations(updatedConversations)

    // Save to localStorage
    localStorage.setItem("conversations", JSON.stringify(updatedConversations))
  }

  // Delete a conversation
  const deleteConversation = (id: string) => {
    const updatedConversations = conversations.filter((conv) => conv.id !== id)
    setConversations(updatedConversations)

    // If the deleted conversation is the current one, clear it
    if (id === currentConversationId) {
      setCurrentConversationId(null)
      setMessages([])
    }

    // Save to localStorage
    localStorage.setItem("conversations", JSON.stringify(updatedConversations))
  }

  // Clear the current conversation
  const clearCurrentConversation = () => {
    setMessages([])

    if (currentConversationId) {
      // Remove the conversation from the list
      const updatedConversations = conversations.filter((conv) => conv.id !== currentConversationId)
      setConversations(updatedConversations)
      setCurrentConversationId(null)

      // Save to localStorage
      localStorage.setItem("conversations", JSON.stringify(updatedConversations))
    }
  }

  // Update settings
  const updateSettings = (newSettings: Partial<Settings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)

    // Save to localStorage
    localStorage.setItem("aiSettings", JSON.stringify(updatedSettings))
  }

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        currentConversationId,
        messages,
        settings,
        isProcessing,
        startNewConversation,
        loadConversation,
        addMessage,
        saveConversation,
        deleteConversation,
        clearCurrentConversation,
        updateSettings,
        getConversationHistory,
        analyzeConversation,
        getConversationSummary,
      }}
    >
      {children}
    </ConversationContext.Provider>
  )
}

export function useConversation() {
  const context = useContext(ConversationContext)
  if (context === undefined) {
    throw new Error("useConversation must be used within a ConversationProvider")
  }
  return context
}

