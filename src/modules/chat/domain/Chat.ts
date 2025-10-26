import { Message, MessageResponse } from './Message';
import { ChatContext } from './ChatContext';

export enum ChatStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export interface ChatProps {
  id: string;
  automationId: string;
  status: ChatStatus;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  context: ChatContext;
}

export interface ChatResponse {
  id: string;
  automationId: string;
  status: ChatStatus;
  createdAt: string;
  updatedAt: string;
  messagesCount: number;
  lastMessage?: MessageResponse;
  context: ReturnType<ChatContext['toObject']>;
}

export interface ChatDetailResponse extends ChatResponse {
  messages: MessageResponse[];
}

export interface CreateChatProps {
  automationId: string;
  context: ChatContext;
}

export class Chat {
  private readonly id: string;
  private readonly automationId: string;
  private status: ChatStatus;
  private readonly createdAt: Date;
  private updatedAt: Date;
  private messages: Message[];
  private context: ChatContext;

  constructor(props: ChatProps) {
    this.id = props.id;
    this.automationId = props.automationId;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.messages = props.messages;
    this.context = props.context;
  }

  public getId(): string {
    return this.id;
  }

  public getAutomationId(): string {
    return this.automationId;
  }

  public getStatus(): ChatStatus {
    return this.status;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  public getMessages(): Message[] {
    return this.messages;
  }

  public getContext(): ChatContext {
    return this.context;
  }

  public addMessage(message: Message): void {
    this.messages.push(message);
    this.updatedAt = new Date();
  }

  public updateContext(context: ChatContext): void {
    this.context = context;
    this.updatedAt = new Date();
  }

  public archive(): void {
    this.status = ChatStatus.ARCHIVED;
    this.updatedAt = new Date();
  }

  public activate(): void {
    this.status = ChatStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  public getLastMessage(): Message | undefined {
    return this.messages[this.messages.length - 1];
  }

  public toResponse(): ChatResponse {
    const lastMessage = this.getLastMessage();
    return {
      id: this.id,
      automationId: this.automationId,
      status: this.status,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      messagesCount: this.messages.length,
      lastMessage: lastMessage?.toResponse(),
      context: this.context.toObject(),
    };
  }

  public toDetailResponse(): ChatDetailResponse {
    return {
      ...this.toResponse(),
      messages: this.messages.map(m => m.toResponse()),
    };
  }
}
