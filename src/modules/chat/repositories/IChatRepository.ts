import { Chat } from '../domain/Chat';

export interface IChatRepository {
  create(chat: Chat): Promise<Chat>;
  findById(id: string): Promise<Chat | undefined>;
  findByAutomationId(automationId: string): Promise<Chat[]>;
  findAll(): Promise<Chat[]>;
  update(chat: Chat): Promise<Chat>;
  delete(id: string): Promise<void>;
}
