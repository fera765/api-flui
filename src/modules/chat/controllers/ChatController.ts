import { Request, Response } from 'express';
import { ChatService } from '../services/ChatService';

export class ChatController {
  constructor(private chatService: ChatService) {}

  /**
   * Create a new chat
   * POST /api/chats
   */
  create = async (req: Request, res: Response): Promise<void> => {
    const { automationId } = req.body;

    if (!automationId) {
      res.status(400).json({ error: 'automationId is required' });
      return;
    }

    const chat = await this.chatService.createChat({ automationId });

    res.status(201).json(chat.toDetailResponse());
  };

  /**
   * Get chat by ID
   * GET /api/chats/:id
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const chat = await this.chatService.getChat(id);

    res.json(chat.toDetailResponse());
  };

  /**
   * List all chats (optionally filter by automation)
   * GET /api/chats?automationId=xxx
   */
  list = async (req: Request, res: Response): Promise<void> => {
    const { automationId } = req.query;

    let chats;
    if (automationId && typeof automationId === 'string') {
      chats = await this.chatService.listChatsByAutomation(automationId);
    } else {
      chats = await this.chatService.listAllChats();
    }

    res.json(chats.map(chat => chat.toResponse()));
  };

  /**
   * Send a message to chat
   * POST /api/chats/:id/messages
   */
  sendMessage = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    const message = await this.chatService.sendMessage({
      chatId: id,
      content,
    });

    res.json(message.toResponse());
  };

  /**
   * Stream a message response (SSE)
   * GET /api/chats/:id/stream?message=xxx
   */
  streamMessage = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { message } = req.query;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'message query parameter is required' });
      return;
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // Stream the response
      for await (const chunk of this.chatService.streamMessage({
        chatId: id,
        content: message,
      })) {
        // Send SSE event
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      // Send completion event
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      // Send error event
      res.write(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
      res.end();
    }
  };

  /**
   * Get chat messages
   * GET /api/chats/:id/messages
   */
  getMessages = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const messages = await this.chatService.getMessages(id);

    res.json(messages.map(msg => msg.toResponse()));
  };

  /**
   * Archive chat
   * PATCH /api/chats/:id/archive
   */
  archive = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const chat = await this.chatService.archiveChat(id);

    res.json(chat.toResponse());
  };

  /**
   * Delete chat
   * DELETE /api/chats/:id
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    await this.chatService.deleteChat(id);

    res.status(204).send();
  };
}
