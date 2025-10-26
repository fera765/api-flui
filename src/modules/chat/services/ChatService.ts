import { randomUUID } from 'crypto';
import { Chat, ChatStatus } from '../domain/Chat';
import { Message, MessageRole } from '../domain/Message';
import { IChatRepository } from '../repositories/IChatRepository';
import { ContextBuilder } from './ContextBuilder';
import { LLMChatService } from './LLMChatService';
import { AppError } from '@shared/errors';

export interface SendMessageDTO {
  chatId: string;
  content: string;
}

export interface CreateChatDTO {
  automationId: string;
}

export class ChatService {
  constructor(
    private chatRepository: IChatRepository,
    private contextBuilder: ContextBuilder,
    private llmService: LLMChatService
  ) {}

  /**
   * Create a new chat session for an automation
   */
  async createChat(dto: CreateChatDTO): Promise<Chat> {
    // Build context for the automation
    const context = await this.contextBuilder.buildContext(dto.automationId);

    // Create chat entity
    const chat = new Chat({
      id: randomUUID(),
      automationId: dto.automationId,
      status: ChatStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      context,
    });

    // Add initial system message
    const systemMessage = new Message({
      id: randomUUID(),
      chatId: chat.getId(),
      role: MessageRole.SYSTEM,
      content: `Chat initialized for automation: ${context.getAutomation().name}`,
      timestamp: new Date(),
    });

    chat.addMessage(systemMessage);

    // Save to repository
    await this.chatRepository.create(chat);

    return chat;
  }

  /**
   * Send a message to the chat and get LLM response
   */
  async sendMessage(dto: SendMessageDTO): Promise<Message> {
    // Get chat
    const chat = await this.chatRepository.findById(dto.chatId);
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }

    if (chat.getStatus() !== ChatStatus.ACTIVE) {
      throw new AppError('Chat is not active', 400);
    }

    // Create user message
    const userMessage = new Message({
      id: randomUUID(),
      chatId: chat.getId(),
      role: MessageRole.USER,
      content: dto.content,
      timestamp: new Date(),
    });

    chat.addMessage(userMessage);

    // Update context if needed (refresh execution data)
    const updatedContext = await this.contextBuilder.updateContext(
      chat.getContext(),
      chat.getAutomationId()
    );
    chat.updateContext(updatedContext);

    // Generate LLM response
    const llmResponse = await this.llmService.generateResponse(
      chat.getMessages(),
      chat.getContext()
    );

    // Create assistant message
    const assistantMessage = new Message({
      id: randomUUID(),
      chatId: chat.getId(),
      role: MessageRole.ASSISTANT,
      content: llmResponse.content,
      timestamp: new Date(),
      metadata: llmResponse.metadata,
    });

    chat.addMessage(assistantMessage);

    // Save updated chat
    await this.chatRepository.update(chat);

    return assistantMessage;
  }

  /**
   * Stream a message response (for real-time interaction)
   */
  async* streamMessage(dto: SendMessageDTO): AsyncGenerator<string> {
    // Get chat
    const chat = await this.chatRepository.findById(dto.chatId);
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }

    if (chat.getStatus() !== ChatStatus.ACTIVE) {
      throw new AppError('Chat is not active', 400);
    }

    // Create user message
    const userMessage = new Message({
      id: randomUUID(),
      chatId: chat.getId(),
      role: MessageRole.USER,
      content: dto.content,
      timestamp: new Date(),
    });

    chat.addMessage(userMessage);

    // Update context
    const updatedContext = await this.contextBuilder.updateContext(
      chat.getContext(),
      chat.getAutomationId()
    );
    chat.updateContext(updatedContext);

    // Stream LLM response
    let fullContent = '';
    for await (const chunk of this.llmService.streamResponse(
      chat.getMessages(),
      chat.getContext()
    )) {
      fullContent += chunk.content;
      yield chunk.content;
    }

    // Create assistant message with full content
    const assistantMessage = new Message({
      id: randomUUID(),
      chatId: chat.getId(),
      role: MessageRole.ASSISTANT,
      content: fullContent,
      timestamp: new Date(),
    });

    chat.addMessage(assistantMessage);

    // Save updated chat
    await this.chatRepository.update(chat);
  }

  /**
   * Get chat by ID with full details
   */
  async getChat(chatId: string): Promise<Chat> {
    const chat = await this.chatRepository.findById(chatId);
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }
    return chat;
  }

  /**
   * List all chats for an automation
   */
  async listChatsByAutomation(automationId: string): Promise<Chat[]> {
    return await this.chatRepository.findByAutomationId(automationId);
  }

  /**
   * List all chats
   */
  async listAllChats(): Promise<Chat[]> {
    return await this.chatRepository.findAll();
  }

  /**
   * Archive a chat (soft delete)
   */
  async archiveChat(chatId: string): Promise<Chat> {
    const chat = await this.chatRepository.findById(chatId);
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }

    chat.archive();
    await this.chatRepository.update(chat);

    return chat;
  }

  /**
   * Delete a chat (hard delete)
   */
  async deleteChat(chatId: string): Promise<void> {
    const chat = await this.chatRepository.findById(chatId);
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }

    await this.chatRepository.delete(chatId);
  }

  /**
   * Get chat messages
   */
  async getMessages(chatId: string): Promise<Message[]> {
    const chat = await this.chatRepository.findById(chatId);
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }

    return chat.getMessages();
  }
}
