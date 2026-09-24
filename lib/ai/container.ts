import { TogetherModelGateway } from "./adapters/together-model-gateway"
import { ChatService } from "./chat-service"

let service: ChatService | undefined

export function getChatService(): ChatService {
  if (!service) service = new ChatService(new TogetherModelGateway())
  return service
}
