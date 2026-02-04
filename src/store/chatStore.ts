import { create } from "zustand";
import type { Thread, Message } from "@/types/chat";
import { get as getFromDb, getAll, put, Stores } from "@/utils/sqliteDb";

const META_KEY_ACTIVE_THREAD = "chat_active_thread_id";

interface ChatStore {
  threads: Thread[];
  messagesByThreadId: Record<string, Message[]>;
  activeThreadId: string | null;
  addThread: (initialTitle?: string) => Promise<string>;
  setActiveThread: (id: string | null) => Promise<void>;
  addMessage: (
    threadId: string,
    message: Omit<Message, "id" | "threadId" | "createdAt">
  ) => Promise<string>;
  updateMessage: (messageId: string, content: string) => Promise<void>;
  updateThreadTitle: (threadId: string, title: string) => Promise<void>;
  closeThread: (threadId: string) => Promise<void>;
  ensureDefaultThread: () => Promise<string>;
  loadFromStorage: () => Promise<void>;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  threads: [],
  messagesByThreadId: {},
  activeThreadId: null,

  loadFromStorage: async () => {
    const allThreads = (await getAll<Thread>(Stores.chat_threads)) ?? [];
    // Filter threads to only show those with toShowInSidebar === true
    const threads = allThreads.filter((t) => t.toShowInSidebar !== false);
    // Sort threads by updatedAt (or createdAt if updatedAt is missing), newest first
    threads.sort((a, b) => {
      const aDate = a.updatedAt ?? a.createdAt;
      const bDate = b.updatedAt ?? b.createdAt;
      return bDate - aDate; // Descending order (newest first)
    });
    const messages = (await getAll<Message>(Stores.chat_messages)) ?? [];
    const messagesByThreadId = messages.reduce<Record<string, Message[]>>(
      (acc, m) => {
        if (!acc[m.threadId]) acc[m.threadId] = [];
        acc[m.threadId].push(m);
        return acc;
      },
      {}
    );
    for (const arr of Object.values(messagesByThreadId)) {
      arr.sort((a, b) => a.createdAt - b.createdAt);
    }
    let activeThreadId: string | null = null;
    const metaRecord = await getFromDb<{ k: string; v: unknown }>(
      Stores.meta,
      META_KEY_ACTIVE_THREAD
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

  addThread: async (initialTitle) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const thread: Thread = {
      id,
      title: initialTitle ?? "New chat",
      createdAt: now,
      updatedAt: now,
      toShowInSidebar: true,
    };
    await put(Stores.chat_threads, thread);
    await put(Stores.meta, { k: META_KEY_ACTIVE_THREAD, v: id });
    set((state) => ({
      threads: [thread, ...state.threads],
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
    return id;
  },

  updateMessage: async (messageId, content) => {
    // Find the message in the store
    const state = get();
    let foundMessage: Message | null = null;
    let threadId: string | null = null;

    for (const [tid, messages] of Object.entries(state.messagesByThreadId)) {
      const msg = messages.find((m) => m.id === messageId);
      if (msg) {
        foundMessage = msg;
        threadId = tid;
        break;
      }
    }

    if (!foundMessage || !threadId) {
      throw new Error(`Message ${messageId} not found`);
    }

    const updatedMessage: Message = {
      ...foundMessage,
      content,
    };

    await put(Stores.chat_messages, updatedMessage);
    set((state) => {
      const list = state.messagesByThreadId[threadId] ?? [];
      const updatedList = list.map((m) =>
        m.id === messageId ? updatedMessage : m
      );
      return {
        messagesByThreadId: {
          ...state.messagesByThreadId,
          [threadId]: updatedList,
        },
      };
    });
  },

  updateThreadTitle: async (threadId, title) => {
    const state = get();
    const thread = state.threads.find((t) => t.id === threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    const updatedThread: Thread = {
      ...thread,
      title,
      updatedAt: Date.now(),
    };

    await put(Stores.chat_threads, updatedThread);
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId ? updatedThread : t
      ),
    }));
  },

  closeThread: async (threadId) => {
    const state = get();
    // Get all threads from DB (including hidden ones) to find the thread
    const allThreads = (await getAll<Thread>(Stores.chat_threads)) ?? [];
    const thread = allThreads.find((t) => t.id === threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }

    const updatedThread: Thread = {
      ...thread,
      toShowInSidebar: false,
      updatedAt: Date.now(),
    };

    await put(Stores.chat_threads, updatedThread);

    // Remove from visible threads
    const newThreads = state.threads.filter((t) => t.id !== threadId);

    // If the closed thread was active, switch to another thread
    let newActiveThreadId = state.activeThreadId;
    if (state.activeThreadId === threadId) {
      newActiveThreadId = newThreads.length > 0 ? newThreads[0].id : null;
      if (newActiveThreadId) {
        await put(Stores.meta, {
          k: META_KEY_ACTIVE_THREAD,
          v: newActiveThreadId,
        });
      }
    }

    set({
      threads: newThreads,
      activeThreadId: newActiveThreadId,
    });
  },

  ensureDefaultThread: async () => {
    const { threads, addThread } = get();
    if (threads.length === 0) return addThread();
    let activeThreadId: string | null = null;
    const metaRecord = await getFromDb<{ k: string; v: unknown }>(
      Stores.meta,
      META_KEY_ACTIVE_THREAD
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
