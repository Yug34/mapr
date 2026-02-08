import { create } from "zustand";
import type { Thread, Message } from "@/types/chat";
import {
  get as getFromDb,
  getAll,
  put,
  deleteKey,
  deleteChatMessagesByThreadId,
  Stores,
} from "@/utils/sqliteDb";

const META_KEY_ACTIVE_THREAD = "chat_active_thread_id";

/** Sort threads by updatedAt (or createdAt), newest first. Mutates in place. */
function sortThreadsByUpdatedDesc(threads: Thread[]): void {
  threads.sort((a, b) => {
    const aDate = a.updatedAt ?? a.createdAt;
    const bDate = b.updatedAt ?? b.createdAt;
    return bDate - aDate;
  });
}

async function getThreadById(threadId: string): Promise<Thread> {
  const allThreads = (await getAll<Thread>(Stores.chat_threads)) ?? [];
  const thread = allThreads.find((t) => t.id === threadId);
  if (!thread) {
    throw new Error(`Thread ${threadId} not found`);
  }
  return thread;
}

function pickNextActiveThreadId(
  openThreads: Thread[],
  fallbackThreads: Thread[]
): string | null {
  return openThreads.length > 0 ? openThreads[0].id : fallbackThreads[0]?.id ?? null;
}

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
  reopenThread: (threadId: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  ensureThreadVisible: (threadId: string) => Promise<void>;
  ensureDefaultThread: () => Promise<string>;
  loadFromStorage: () => Promise<void>;
  getAllThreads: () => Promise<Thread[]>;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  threads: [],
  messagesByThreadId: {},
  activeThreadId: null,

  loadFromStorage: async () => {
    const allThreads = (await getAll<Thread>(Stores.chat_threads)) ?? [];
    // Filter threads to only show those with toShowInSidebar === true
    const threads = allThreads.filter((t) => t.toShowInSidebar !== false);
    sortThreadsByUpdatedDesc(threads);
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
    const openThreads = threads.filter((t) => t.isOpen !== false);
    if (threads.length > 0) {
      const activeIsValid =
        activeThreadId && threads.some((t) => t.id === activeThreadId);
      const activeIsOpen =
        activeThreadId && openThreads.some((t) => t.id === activeThreadId);
      if (!activeIsValid || !activeIsOpen) {
        activeThreadId =
          openThreads.length > 0 ? openThreads[0].id : threads[0].id;
        await put(Stores.meta, {
          k: META_KEY_ACTIVE_THREAD,
          v: activeThreadId,
        });
      }
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
      isOpen: true,
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
    const thread = await getThreadById(threadId);

    const updatedThread: Thread = {
      ...thread,
      toShowInSidebar: false,
      isOpen: false,
      updatedAt: Date.now(),
    };

    await put(Stores.chat_threads, updatedThread);

    // Remove from visible threads
    const newThreads = state.threads.filter((t) => t.id !== threadId);
    const openThreads = newThreads.filter((t) => t.isOpen !== false);

    // If the closed thread was active, switch to another open thread
    let newActiveThreadId = state.activeThreadId;
    if (state.activeThreadId === threadId) {
      newActiveThreadId = pickNextActiveThreadId(openThreads, newThreads);
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

  reopenThread: async (threadId) => {
    const state = get();
    const thread = await getThreadById(threadId);

    const updatedThread: Thread = {
      ...thread,
      toShowInSidebar: true,
      isOpen: true,
      updatedAt: Date.now(),
    };

    await put(Stores.chat_threads, updatedThread);

    // Add to visible threads if not already there
    const threadExists = state.threads.some((t) => t.id === threadId);
    const newThreads = threadExists
      ? state.threads.map((t) => (t.id === threadId ? updatedThread : t))
      : [updatedThread, ...state.threads];

    sortThreadsByUpdatedDesc(newThreads);

    set({
      threads: newThreads,
    });
  },

  deleteThread: async (threadId) => {
    const state = get();
    await deleteChatMessagesByThreadId(threadId);
    await deleteKey(Stores.chat_threads, threadId);
    const newThreads = state.threads.filter((t) => t.id !== threadId);
    const { [threadId]: _, ...restMessages } = state.messagesByThreadId;
    let newActiveThreadId = state.activeThreadId;
    if (state.activeThreadId === threadId) {
      const openThreads = newThreads.filter((t) => t.isOpen !== false);
      newActiveThreadId = pickNextActiveThreadId(openThreads, newThreads);
      if (newActiveThreadId) {
        await put(Stores.meta, {
          k: META_KEY_ACTIVE_THREAD,
          v: newActiveThreadId,
        });
      } else {
        newActiveThreadId = null;
      }
    }
    set({
      threads: newThreads,
      messagesByThreadId: restMessages,
      activeThreadId: newActiveThreadId,
    });
  },

  ensureThreadVisible: async (threadId) => {
    const state = get();
    const thread = await getThreadById(threadId);

    const now = Date.now();
    let updatedThread: Thread;

    // If thread is not visible, make it visible and open
    if (thread.toShowInSidebar === false) {
      updatedThread = {
        ...thread,
        toShowInSidebar: true,
        isOpen: true,
        updatedAt: now,
      };
      await put(Stores.chat_threads, updatedThread);
    } else {
      // Even if visible, update the timestamp and ensure open so it appears at the top
      updatedThread = {
        ...thread,
        isOpen: true,
        updatedAt: now,
      };
      await put(Stores.chat_threads, updatedThread);
    }

    // Update store state directly - only add/update this specific thread
    const threadExists = state.threads.some((t) => t.id === threadId);
    const newThreads = threadExists
      ? state.threads.map((t) => (t.id === threadId ? updatedThread : t))
      : [updatedThread, ...state.threads];

    sortThreadsByUpdatedDesc(newThreads);

    set({
      threads: newThreads,
    });
  },

  ensureDefaultThread: async () => {
    const { threads, addThread } = get();
    if (threads.length === 0) return addThread();
    const openThreads = threads.filter((t) => t.isOpen !== false);
    let activeThreadId: string | null = null;
    const metaRecord = await getFromDb<{ k: string; v: unknown }>(
      Stores.meta,
      META_KEY_ACTIVE_THREAD
    );
    if (metaRecord && typeof metaRecord.v === "string") {
      activeThreadId = metaRecord.v;
    }
    const activeIsOpen =
      activeThreadId && openThreads.some((t) => t.id === activeThreadId);
    const id =
      activeIsOpen && activeThreadId
        ? activeThreadId
        : openThreads.length > 0
        ? openThreads[0].id
        : threads[0].id;
    if (id !== activeThreadId) {
      await put(Stores.meta, { k: META_KEY_ACTIVE_THREAD, v: id });
    }
    set({ activeThreadId: id });
    return id;
  },

  getAllThreads: async () => {
    const allThreads = (await getAll<Thread>(Stores.chat_threads)) ?? [];
    sortThreadsByUpdatedDesc(allThreads);
    return allThreads;
  },
}));
