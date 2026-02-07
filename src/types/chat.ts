export type MessageRole = "user" | "assistant" | "summary";

export interface Thread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt?: number;
  toShowInSidebar?: boolean;
  isOpen?: boolean;
}

export interface Message {
  id: string;
  threadId: string;
  role: MessageRole;
  content: string;
  sourceNodeId?: string;
  sourceTitle?: string;
  createdAt: number;
}
