import { create } from "zustand";
import type { Thread, Message } from "@/types/chat";

const STORAGE_KEY_THREADS = "mapr-chat-threads";
const STORAGE_KEY_MESSAGES = "mapr-chat-messages";
const STORAGE_KEY_ACTIVE = "mapr-chat-active-thread-id";

function loadThreads(): Thread[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_THREADS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Thread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadMessages(): Record<string, Message[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Message[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function loadActiveThreadId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE);
  } catch {
    return null;
  }
}

interface ChatStore {
  threads: Thread[];
  messagesByThreadId: Record<string, Message[]>;
  activeThreadId: string | null;
  addThread: () => string;
  setActiveThread: (id: string | null) => void;
  addMessage: (threadId: string, message: Omit<Message, "id" | "threadId" | "createdAt">) => void;
  ensureDefaultThread: () => string;
  loadFromStorage: () => void;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  threads: [],
  messagesByThreadId: {},
  activeThreadId: null,

  loadFromStorage: () => {
    const threads = loadThreads();
    const messagesByThreadId = loadMessages();
    let activeThreadId = loadActiveThreadId();
    if (threads.length > 0 && (!activeThreadId || !threads.some((t) => t.id === activeThreadId))) {
      activeThreadId = threads[0].id;
      localStorage.setItem(STORAGE_KEY_ACTIVE, activeThreadId);
    }
    set({ threads, messagesByThreadId, activeThreadId });
  },

  addThread: () => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const thread: Thread = {
      id,
      title: "New chat",
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const threads = [...state.threads, thread];
      const messagesByThreadId = { ...state.messagesByThreadId, [id]: [] };
      try {
        localStorage.setItem(STORAGE_KEY_THREADS, JSON.stringify(threads));
        localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messagesByThreadId));
        localStorage.setItem(STORAGE_KEY_ACTIVE, id);
      } catch {
        // ignore
      }
      return {
        threads,
        messagesByThreadId,
        activeThreadId: id,
      };
    });
    return id;
  },

  setActiveThread: (id) => {
    set({ activeThreadId: id });
    try {
      if (id) localStorage.setItem(STORAGE_KEY_ACTIVE, id);
    } catch {
      // ignore
    }
  },

  addMessage: (threadId, partial) => {
    const id = crypto.randomUUID();
    const createdAt = Date.now();
    const message: Message = {
      id,
      threadId,
      role: partial.role,
      content: partial.content,
      sourceNodeId: partial.sourceNodeId,
      sourceTitle: partial.sourceTitle,
      createdAt,
    };
    set((state) => {
      const list = state.messagesByThreadId[threadId] ?? [];
      const messages = [...list, message];
      const messagesByThreadId = { ...state.messagesByThreadId, [threadId]: messages };
      try {
        localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messagesByThreadId));
      } catch {
        // ignore
      }
      return { messagesByThreadId };
    });
  },

  ensureDefaultThread: () => {
    const { threads, activeThreadId, addThread } = get();
    if (threads.length === 0) {
      return addThread();
    }
    const id = activeThreadId ?? threads[0].id;
    set({ activeThreadId: id });
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE, id);
    } catch {
      // ignore
    }
    return id;
  },
}));
