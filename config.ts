const config = {
  defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  availableModels: [
    { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", name: "Llama 3.3 70B Instruct" },
    { id: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo", name: "Llama 3.2 11B Vision" },
    { id: "mistralai/Mistral-7B-Instruct-v0.2", name: "Mistral 7B Instruct" },
    { id: "mistralai/Mixtral-8x7B-Instruct-v0.1", name: "Mixtral 8x7B Instruct" },
  ],
  apiEndpoints: {
    completion: "/api/completion",
    models: "/api/models",
  },
  systemSettings: {
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.9,
  },
}

export default config
