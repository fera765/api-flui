import { Chat } from '../domain/Chat';
import { IChatRepository } from './IChatRepository';

export class InMemoryChatRepository implements IChatRepository {
  private chats: Map<string, Chat> = new Map();

  async create(chat: Chat): Promise<Chat> {
    this.chats.set(chat.getId(), chat);
    return chat;
  }

  async findById(id: string): Promise<Chat | undefined> {
    return this.chats.get(id);
  }

  async findByAutomationId(automationId: string): Promise<Chat[]> {
    return Array.from(this.chats.values()).filter(
      chat => chat.getAutomationId() === automationId
    );
  }

  async findAll(): Promise<Chat[]> {
    return Array.from(this.chats.values());
  }

  async update(chat: Chat): Promise<Chat> {
    this.chats.set(chat.getId(), chat);
    return chat;
  }

  async delete(id: string): Promise<void> {
    this.chats.delete(id);
  }

  // Utility methods for testing
  clear(): void {
    this.chats.clear();
  }

  count(): number {
    return this.chats.size;
  }
}
