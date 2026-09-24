const config = {
  defaultModel: "",
  availableModels: [],
  apiEndpoints: {
    completion: "/api/completion",
    models: "/api/models",
  },
  systemSettings: { temperature: 0.7, maxTokens: 2000, topP: 0.9 },
}

export default config
