import { create } from "zustand";
import type { Thread, Message } from "@/types/chat";
import { get as getFromDb, getAll, put, Stores } from "@/utils/sqliteDb";

const META_KEY_ACTIVE_THREAD = "chat_active_thread_id";

interface ChatStore {
  threads: Thread[];
  messagesByThreadId: Record<string, Message[]>;
  activeThreadId: string | null;
  addThread: () => Promise<string>;
  setActiveThread: (id: string | null) => Promise<void>;
  addMessage: (
    threadId: string,
    message: Omit<Message, "id" | "threadId" | "createdAt">,
  ) => Promise<void>;
  ensureDefaultThread: () => Promise<string>;
  loadFromStorage: () => Promise<void>;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  threads: [],
  messagesByThreadId: {},
  activeThreadId: null,

  loadFromStorage: async () => {
    const threads = (await getAll<Thread>(Stores.chat_threads)) ?? [];
    const messages = (await getAll<Message>(Stores.chat_messages)) ?? [];
    const messagesByThreadId = messages.reduce<Record<string, Message[]>>(
      (acc, m) => {
        if (!acc[m.threadId]) acc[m.threadId] = [];
        acc[m.threadId].push(m);
        return acc;
      },
      {},
    );
    for (const arr of Object.values(messagesByThreadId)) {
      arr.sort((a, b) => a.createdAt - b.createdAt);
    }
    let activeThreadId: string | null = null;
    const metaRecord = await getFromDb<{ k: string; v: unknown }>(
      Stores.meta,
      META_KEY_ACTIVE_THREAD,
    );
    if (metaRecord && typeof metaRecord.v === "string") {
      activeThreadId = metaRecord.v;
    }
    if (
      threads.length > 0 &&
      (!activeThreadId || !threads.some((t) => t.id === activeThreadId))
    ) {
      activeThreadId = threads[0].id;
      await put(Stores.meta, { k: META_KEY_ACTIVE_THREAD, v: activeThreadId });
    }
    set({ threads, messagesByThreadId, activeThreadId });
  },

  addThread: async () => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const thread: Thread = {
      id,
      title: "New chat",
      createdAt: now,
      updatedAt: now,
    };
    await put(Stores.chat_threads, thread);
    await put(Stores.meta, { k: META_KEY_ACTIVE_THREAD, v: id });
    set((state) => ({
      threads: [...state.threads, thread],
      messagesByThreadId: { ...state.messagesByThreadId, [id]: [] },
      activeThreadId: id,
    }));
    return id;
  },

  setActiveThread: async (id) => {
    if (id) {
      await put(Stores.meta, { k: META_KEY_ACTIVE_THREAD, v: id });
    }
    set({ activeThreadId: id });
  },

  addMessage: async (threadId, partial) => {
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
    await put(Stores.chat_messages, message);
    set((state) => {
      const list = state.messagesByThreadId[threadId] ?? [];
      return {
        messagesByThreadId: {
          ...state.messagesByThreadId,
          [threadId]: [...list, message],
        },
      };
    });
  },

  ensureDefaultThread: async () => {
    const { threads, addThread } = get();
    if (threads.length === 0) return addThread();
    let activeThreadId: string | null = null;
    const metaRecord = await getFromDb<{ k: string; v: unknown }>(
      Stores.meta,
      META_KEY_ACTIVE_THREAD,
    );
    if (metaRecord && typeof metaRecord.v === "string") {
      activeThreadId = metaRecord.v;
    }
    const id =
      activeThreadId && threads.some((t) => t.id === activeThreadId)
        ? activeThreadId
        : threads[0].id;
    if (id !== activeThreadId) {
      await put(Stores.meta, { k: META_KEY_ACTIVE_THREAD, v: id });
    }
    set({ activeThreadId: id });
    return id;
  },
}));
