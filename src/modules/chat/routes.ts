import { ChatController } from './controllers/ChatController';
import { ChatService } from './services/ChatService';
import { ContextBuilder } from './services/ContextBuilder';
import { LLMChatService } from './services/LLMChatService';
import { InMemoryChatRepository } from './repositories/InMemoryChatRepository';
import { createChatRoutes } from './routes/chat.routes';

// Import singletons from core module
import {
  automationRepository,
  executionLogRepository,
  systemToolRepository,
  agentRepository,
} from '@shared/repositories/singletons';

// Create chat repository singleton
const chatRepository = new InMemoryChatRepository();

// Create services
const contextBuilder = new ContextBuilder(
  automationRepository,
  executionLogRepository,
  systemToolRepository,
  agentRepository
);

const llmService = new LLMChatService();

const chatService = new ChatService(
  chatRepository,
  contextBuilder,
  llmService
);

// Create controller
const chatController = new ChatController(chatService);

// Export router
export const chatRoutes = createChatRoutes(chatController);

// Export for testing
export { chatRepository, chatService, contextBuilder, llmService };
