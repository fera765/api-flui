import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { asyncHandler } from '@shared/utils/asyncHandler';

export function createChatRoutes(chatController: ChatController): Router {
  const routes = Router();

  // Create new chat
  routes.post('/', asyncHandler(chatController.create));

  // List chats
  routes.get('/', asyncHandler(chatController.list));

  // Get chat by ID
  routes.get('/:id', asyncHandler(chatController.getById));

  // Send message
  routes.post('/:id/messages', asyncHandler(chatController.sendMessage));

  // Get messages
  routes.get('/:id/messages', asyncHandler(chatController.getMessages));

  // Stream message (SSE)
  routes.get('/:id/stream', asyncHandler(chatController.streamMessage));

  // Archive chat
  routes.patch('/:id/archive', asyncHandler(chatController.archive));

  // Delete chat
  routes.delete('/:id', asyncHandler(chatController.delete));

  return routes;
}
