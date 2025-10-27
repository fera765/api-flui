import { API_BASE_URL } from '@/lib/api';

export interface ChatMessage {
  id: string;
  chatId: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ChatContext {
  automation: {
    id: string;
    name: string;
    description?: string;
    status: string;
    nodesCount: number;
    linksCount: number;
  };
  lastExecution?: {
    id: string;
    automationId: string;
    status: string;
    startedAt: string;
    completedAt?: string;
    result?: any;
    error?: string;
    logs: any[];
  };
  availableTools: any[];
  availableAgents: any[];
  files: {
    path: string;
    name: string;
    size?: number;
    createdAt: string;
  }[];
}

export interface Chat {
  id: string;
  automationId: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  messagesCount: number;
  lastMessage?: ChatMessage;
  context: ChatContext;
}

export interface ChatDetail extends Chat {
  messages: ChatMessage[];
}

// Create chat for an automation
export async function createChat(automationId: string): Promise<Chat> {
  const response = await fetch(`${API_BASE_URL}/chats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ automationId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create chat' }));
    throw new Error(error.error || 'Failed to create chat');
  }

  return response.json();
}

// Get chat by ID
export async function getChatById(chatId: string): Promise<ChatDetail> {
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch chat');
  }

  return response.json();
}

// List chats for automation
export async function getChatsByAutomation(automationId: string): Promise<Chat[]> {
  const response = await fetch(`${API_BASE_URL}/chats?automationId=${automationId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch chats');
  }

  return response.json();
}

// Send message
export async function sendMessage(chatId: string, content: string): Promise<ChatMessage> {
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to send message' }));
    throw new Error(error.error || 'Failed to send message');
  }

  return response.json();
}

// Stream message (SSE)
export function streamChatMessage(
  chatId: string,
  content: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): () => void {
  const eventSource = new EventSource(
    `${API_BASE_URL}/chats/${chatId}/stream?message=${encodeURIComponent(content)}`
  );

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.done) {
        eventSource.close();
        onComplete();
      } else {
        onChunk(data.content || '');
      }
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  };

  eventSource.onerror = (error) => {
    eventSource.close();
    onError(new Error('Connection error'));
  };

  return () => eventSource.close();
}

// Get messages
export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`);

  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }

  return response.json();
}
