import { OpenAICompatibleModelGateway } from "./adapters/openai-compatible-model-gateway"
import { ChatService } from "./chat-service"

let service: ChatService | undefined

export function getChatService(): ChatService {
  if (!service) service = new ChatService(new OpenAICompatibleModelGateway())
  return service
}
