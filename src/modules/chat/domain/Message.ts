export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export interface MessageMetadata {
  toolCalls?: Array<{
    toolId: string;
    toolName: string;
    input: unknown;
    output: unknown;
  }>;
  files?: string[];
  executionId?: string;
  error?: string;
}

export interface MessageProps {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageResponse {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  metadata?: MessageMetadata;
}

export interface CreateMessageProps {
  chatId: string;
  role: MessageRole;
  content: string;
  metadata?: MessageMetadata;
}

export class Message {
  private readonly id: string;
  private readonly chatId: string;
  private readonly role: MessageRole;
  private readonly content: string;
  private readonly timestamp: Date;
  private metadata?: MessageMetadata;

  constructor(props: MessageProps) {
    this.id = props.id;
    this.chatId = props.chatId;
    this.role = props.role;
    this.content = props.content;
    this.timestamp = props.timestamp;
    this.metadata = props.metadata;
  }

  public getId(): string {
    return this.id;
  }

  public getChatId(): string {
    return this.chatId;
  }

  public getRole(): MessageRole {
    return this.role;
  }

  public getContent(): string {
    return this.content;
  }

  public getTimestamp(): Date {
    return this.timestamp;
  }

  public getMetadata(): MessageMetadata | undefined {
    return this.metadata;
  }

  public setMetadata(metadata: MessageMetadata): void {
    this.metadata = metadata;
  }

  public toResponse(): MessageResponse {
    return {
      id: this.id,
      chatId: this.chatId,
      role: this.role,
      content: this.content,
      timestamp: this.timestamp.toISOString(),
      metadata: this.metadata,
    };
  }
}
