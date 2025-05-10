// Environment configuration with fallbacks for development
const config = {
  // API Keys
  togetherApiKey: process.env.TOGETHER_API_KEY || "env_together_api_key_placeholder",

  // Model configuration
  defaultModel: "mistralai/Mixtral-8x7B-Instruct-v0.1",
  availableModels: [
    { id: "mistralai/Mixtral-8x7B-Instruct-v0.1", name: "Mixtral 8x7B Instruct" },
    { id: "mistralai/Mistral-7B-Instruct-v0.2", name: "Mistral 7B Instruct v0.2" },
    { id: "togethercomputer/llama-2-7b-chat", name: "Llama 2 7B Chat" },
    { id: "NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO", name: "Nous Hermes 2 Mixtral" },
    { id: "Qwen/Qwen1.5-14B-Chat", name: "Qwen 1.5 14B Chat" },
    { id: "google/gemma-7b-it", name: "Gemma 7B Instruct" },
  ],

  // API endpoints
  apiEndpoints: {
    together: "https://api.together.xyz/v1/chat/completions",
    models: "https://api.together.xyz/v1/models",
  },

  // System settings
  systemSettings: {
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.9,
  },

  // Feature flags
  features: {
    advancedReasoning: true,
    contextRetention: true,
    adaptiveLearning: true,
  },
}

export default config

