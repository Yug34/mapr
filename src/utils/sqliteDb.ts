type SqliteWasm = {
  sqlite3Worker1Promiser: () => Promise<
    (type: string, args?: Record<string, unknown>) => Promise<unknown>
  >;
};

export type StoreName =
  | "nodes"
  | "edges"
  | "media"
  | "meta"
  | "tabs"
  | "node_text"
  | "chat_threads"
  | "chat_messages";

export type TxMode = "readonly" | "readwrite";

export type EdgeRecord = {
  id: string;
  source: string;
  target: string;
  tabId: string;
  [extra: string]: unknown;
};

export type MediaRecord = {
  id: string;
  blob: Blob;
  mime: string;
  size: number;
  createdAt: number;
  fileName?: string;
};

export type MetaRecord = { k: string; v: unknown };

import type { TabIconKey } from "../types/common";

export type TabRecord = {
  id: string;
  title: string;
  iconKey?: TabIconKey;
  createdAt: number;
  updatedAt: number;
};

export type NodeTextRecord = {
  nodeId: string;
  plainText: string;
  updatedAt: number;
};

export type ChatThreadRecord = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

export type ChatMessageRecord = {
  id: string;
  threadId: string;
  role: string;
  content: string;
  sourceNodeId?: string | null;
  sourceTitle?: string | null;
  createdAt: number;
};

const OPFS_DB_PREFIX = "canvas";
const DB_FILENAME_MEMORY = ":memory:";

/** OPFS filename shared across tabs for persistence. All tabs use the same file.
 * If multiple tabs open simultaneously, one may fall back to :memory: due to
 * Access Handle conflicts, but data will persist for the tab that successfully opens OPFS.
 */
function getOpfsFilename(): string {
  return `file:${OPFS_DB_PREFIX}-mapr-vault.sqlite3?vfs=opfs`;
}

type Promiser = (
  type: string,
  args?: Record<string, unknown>,
) => Promise<{ type: string; result?: unknown; dbId?: string }>;

let promiser: Promiser | null = null;
let dbId: string | undefined;
let usingMemoryFallback = false;

function isAccessHandleError(msg: string): boolean {
  return /Access Handles cannot be created|NoModificationAllowedError|GetSyncHandleError/i.test(
    msg,
  );
}

function resetInit(): void {
  promiser = null;
  dbId = undefined;
  usingMemoryFallback = true;
}

async function init(): Promise<{ promiser: Promiser; dbId: string }> {
  if (promiser && dbId) return { promiser, dbId };

  const wasm =
    (await import("@sqlite.org/sqlite-wasm")) as unknown as SqliteWasm;
  const factory = await wasm.sqlite3Worker1Promiser();

  type OpenRes = { type: string; result?: { dbId?: string }; dbId?: string };
  type OpenErr = { type?: string; result?: { message?: string } };

  const tryOpen = async (filename: string): Promise<OpenRes> => {
    const res = (await factory("open", { filename })) as OpenRes;
    if (res.type === "error") throw res as OpenErr;
    return res;
  };

  const msgFromErr = (e: unknown): string =>
    (e as OpenErr)?.result?.message ??
    (e instanceof Error ? e.message : String(e));

  let openRes: OpenRes | undefined;

  if (usingMemoryFallback) {
    openRes = await tryOpen(DB_FILENAME_MEMORY);
  } else {
    try {
      // Retry opening OPFS DB with backoff if we get BUSY/locked errors
      // (can happen when multiple tabs try to open simultaneously)
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          openRes = await tryOpen(getOpfsFilename());
          break;
        } catch (e) {
          const msg = msgFromErr(e);
          const isBusy =
            /SQLITE_BUSY|database is locked|Access Handles cannot be created/i.test(
              msg,
            );
          if (isBusy && attempt < 4) {
            await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
            continue;
          }
          throw e;
        }
      }
      if (!openRes) {
        throw new Error("Failed to open SQLite database after retries");
      }
    } catch (e) {
      const msg = msgFromErr(e);
      const opfsUnavailable =
        /no such vfs:\s*opfs/i.test(msg) ||
        /SharedArrayBuffer|Atomics|COOP|COEP/i.test(msg);
      const isAccessHandleConflict =
        /Access Handles cannot be created|NoModificationAllowedError/i.test(
          msg,
        );
      if (isAccessHandleConflict) {
        console.warn(
          "[sqliteDb] OPFS file locked by another tab/instance. Using in-memory DB for this session.",
        );
        usingMemoryFallback = true;
        try {
          openRes = await tryOpen(DB_FILENAME_MEMORY);
        } catch (memErr) {
          throw new Error(
            msgFromErr(memErr) || "Failed to open SQLite (memory fallback)",
          );
        }
      } else if (!opfsUnavailable) {
        throw new Error(msg || "Failed to open SQLite database");
      } else {
        console.warn(
          "[sqliteDb] OPFS unavailable (",
          msg,
          "). Using in-memory DB; data will not persist.",
        );
        usingMemoryFallback = true;
        try {
          openRes = await tryOpen(DB_FILENAME_MEMORY);
        } catch (memErr) {
          throw new Error(
            msgFromErr(memErr) || "Failed to open SQLite (memory fallback)",
          );
        }
      }
    }
  }

  if (!openRes) {
    throw new Error("Failed to open SQLite database");
  }
  const id = openRes.result?.dbId ?? openRes.dbId;
  if (!id) throw new Error("No dbId from SQLite open");
  promiser = factory as Promiser;
  dbId = id;

  await exec(
    `CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      tabId TEXT NOT NULL,
      data TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_nodes_tabId ON nodes(tabId);

    CREATE TABLE IF NOT EXISTS edges (
      id TEXT PRIMARY KEY,
      tabId TEXT NOT NULL,
      data TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_edges_tabId ON edges(tabId);

    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      blobBase64 TEXT NOT NULL,
      mime TEXT NOT NULL,
      size INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      fileName TEXT
    );

    CREATE TABLE IF NOT EXISTS meta (
      k TEXT PRIMARY KEY,
      v TEXT
    );

    CREATE TABLE IF NOT EXISTS tabs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      iconKey TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS node_text (
      nodeId TEXT PRIMARY KEY,
      plainText TEXT NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_threads (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      threadId TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      sourceNodeId TEXT,
      sourceTitle TEXT,
      createdAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_chat_messages_threadId ON chat_messages(threadId);`,
  );

  return { promiser: promiser!, dbId: id };
}

function execErrMsg(e: unknown): string {
  const o = e as { result?: { message?: string } };
  return o?.result?.message ?? (e instanceof Error ? e.message : String(e));
}

async function exec(
  sql: string,
  bind?: (string | number | null)[],
  retries = 3,
  accessHandleRetried = false,
): Promise<void> {
  const { promiser: p, dbId: id } = await init();
  const opts: Record<string, unknown> = {
    sql,
    dbId: id,
    rowMode: "object",
    returnValue: "resultRows",
    resultRows: [],
  };
  if (bind && bind.length) opts.bind = bind;
  for (let i = 0; i < retries; i++) {
    try {
      const res = (await p("exec", opts)) as {
        type: string;
        result?: { message?: string };
      };
      if (res.type === "error") {
        const msg = (res.result as { message?: string })?.message ?? "";
        const isBusy = /SQLITE_BUSY|database is locked/i.test(msg);
        if (isBusy && i < retries - 1) {
          await new Promise((r) => setTimeout(r, 50 * (i + 1)));
          continue;
        }
        if (
          isAccessHandleError(msg) &&
          !accessHandleRetried &&
          !usingMemoryFallback
        ) {
          console.warn(
            "[sqliteDb] OPFS access conflict (e.g. another tab). Switching to in-memory DB for this session.",
          );
          resetInit();
          return exec(sql, bind, retries, true);
        }
        throw new Error(msg || "SQLite exec failed");
      }
      return;
    } catch (e) {
      const msg = execErrMsg(e);
      const isBusy = /SQLITE_BUSY|database is locked/i.test(msg);
      if (isBusy && i < retries - 1) {
        await new Promise((r) => setTimeout(r, 50 * (i + 1)));
        continue;
      }
      if (
        isAccessHandleError(msg) &&
        !accessHandleRetried &&
        !usingMemoryFallback
      ) {
        console.warn(
          "[sqliteDb] OPFS access conflict (e.g. another tab). Switching to in-memory DB for this session.",
        );
        resetInit();
        return exec(sql, bind, retries, true);
      }
      throw new Error(msg || "SQLite exec failed");
    }
  }
}

export async function execQuery<T extends Record<string, unknown>>(
  sql: string,
  bind?: (string | number | null)[],
  retries = 3,
  accessHandleRetried = false,
): Promise<T[]> {
  const { promiser: p, dbId: id } = await init();
  const opts: Record<string, unknown> = {
    sql,
    dbId: id,
    rowMode: "object",
    returnValue: "resultRows",
    resultRows: [] as T[],
  };
  if (bind && bind.length) opts.bind = bind;
  for (let i = 0; i < retries; i++) {
    try {
      const res = (await p("exec", opts)) as {
        type: string;
        result?: { resultRows?: T[]; message?: string };
      };
      if (res.type === "error") {
        const msg = res.result?.message ?? "";
        const isBusy = /SQLITE_BUSY|database is locked/i.test(msg);
        if (isBusy && i < retries - 1) {
          await new Promise((r) => setTimeout(r, 50 * (i + 1)));
          continue;
        }
        if (
          isAccessHandleError(msg) &&
          !accessHandleRetried &&
          !usingMemoryFallback
        ) {
          console.warn(
            "[sqliteDb] OPFS access conflict (e.g. another tab). Switching to in-memory DB for this session.",
          );
          resetInit();
          return execQuery<T>(sql, bind, retries, true);
        }
        throw new Error(msg || "SQLite exec failed");
      }
      return (res.result?.resultRows ?? []) as T[];
    } catch (e) {
      const msg = execErrMsg(e);
      const isBusy = /SQLITE_BUSY|database is locked/i.test(msg);
      if (isBusy && i < retries - 1) {
        await new Promise((r) => setTimeout(r, 50 * (i + 1)));
        continue;
      }
      if (
        isAccessHandleError(msg) &&
        !accessHandleRetried &&
        !usingMemoryFallback
      ) {
        console.warn(
          "[sqliteDb] OPFS access conflict (e.g. another tab). Switching to in-memory DB for this session.",
        );
        resetInit();
        return execQuery<T>(sql, bind, retries, true);
      }
      throw new Error(msg || "SQLite exec failed");
    }
  }
  throw new Error("SQLite exec failed after retries");
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const dataUrl = r.result as string;
      const base64 = dataUrl.split(",", 2)[1];
      resolve(base64 ?? "");
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, mime: string): Blob {
  const bin = atob(base64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return new Blob([buf], { type: mime });
}

export async function openDb(): Promise<void> {
  await init();
}

/**
 * Gracefully close the SQLite database for this browser tab.
 *
 * This is a best-effort helper to tell the sqlite3 worker to release any
 * OPFS SyncAccessHandle before the tab is closed/reloaded, which helps reduce
 * cross-tab "Access Handles cannot be created" conflicts.
 */
export async function closeDb(): Promise<void> {
  if (!promiser || !dbId) return;

  // Capture current handles, then clear our references so future calls will
  // lazily re-init a fresh connection if needed.
  const p = promiser;
  const id = dbId;
  promiser = null;
  dbId = undefined;

  try {
    await p("close", { dbId: id });
  } catch (e) {
    console.warn("[sqliteDb] Error while closing DB", e);
  }
}

export async function withTransaction<T>(
  _storeNames: StoreName[] | StoreName,
  _mode: TxMode,
  handler: (_tx: IDBTransaction) => Promise<T>,
): Promise<T> {
  return handler({} as IDBTransaction);
}

const keyColumn: Record<StoreName, string> = {
  nodes: "id",
  edges: "id",
  media: "id",
  meta: "k",
  tabs: "id",
  node_text: "nodeId",
  chat_threads: "id",
  chat_messages: "id",
};

export async function get<T = unknown>(
  store: StoreName,
  key: string,
): Promise<T | undefined> {
  const col = keyColumn[store];
  const table = store;
  const rows = await execQuery<Record<string, unknown>>(
    `SELECT * FROM ${table} WHERE ${col} = ?`,
    [key],
  );
  if (rows.length === 0) return undefined;
  const row = rows[0];
  if (store === "media") {
    const blob = base64ToBlob(
      (row.blobBase64 as string) ?? "",
      (row.mime as string) ?? "application/octet-stream",
    );
    return {
      id: row.id,
      blob,
      mime: row.mime,
      size: Number(row.size),
      createdAt: Number(row.createdAt),
      fileName: row.fileName as string | undefined,
    } as T;
  }
  if (store === "meta")
    return {
      k: row.k,
      v: row.v == null ? undefined : JSON.parse(String(row.v)),
    } as T;
  if (store === "tabs") {
    return {
      id: row.id,
      title: row.title,
      iconKey: row.iconKey as TabIconKey | undefined,
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt),
    } as T;
  }
  if (store === "node_text") {
    return {
      nodeId: row.nodeId,
      plainText: (row.plainText as string) ?? "",
      updatedAt: Number(row.updatedAt),
    } as T;
  }
  if (store === "chat_threads") {
    return {
      id: row.id,
      title: (row.title as string) ?? "",
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt),
    } as T;
  }
  if (store === "chat_messages") {
    return {
      id: row.id,
      threadId: (row.threadId as string) ?? "",
      role: (row.role as string) ?? "",
      content: (row.content as string) ?? "",
      sourceNodeId: (row.sourceNodeId as string) ?? undefined,
      sourceTitle: (row.sourceTitle as string) ?? undefined,
      createdAt: Number(row.createdAt),
    } as T;
  }
  const data = row.data as string;
  return (data ? JSON.parse(data) : row) as T;
}

export async function getAll<T = unknown>(store: StoreName): Promise<T[]> {
  const table = store;
  const rows = await execQuery<Record<string, unknown>>(
    `SELECT * FROM ${table}`,
  );
  if (store === "media") {
    return rows.map((r) => ({
      id: r.id,
      blob: base64ToBlob(
        (r.blobBase64 as string) ?? "",
        (r.mime as string) ?? "application/octet-stream",
      ),
      mime: r.mime,
      size: Number(r.size),
      createdAt: Number(r.createdAt),
      fileName: r.fileName as string | undefined,
    })) as T[];
  }
  if (store === "meta")
    return rows.map((r) => ({
      k: r.k,
      v: r.v == null ? undefined : JSON.parse(String(r.v)),
    })) as T[];
  if (store === "tabs") {
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      iconKey: r.iconKey as TabIconKey | undefined,
      createdAt: Number(r.createdAt),
      updatedAt: Number(r.updatedAt),
    })) as T[];
  }
  if (store === "node_text") {
    return rows.map((r) => ({
      nodeId: r.nodeId,
      plainText: (r.plainText as string) ?? "",
      updatedAt: Number(r.updatedAt),
    })) as T[];
  }
  if (store === "chat_threads") {
    return rows.map((r) => ({
      id: r.id,
      title: (r.title as string) ?? "",
      createdAt: Number(r.createdAt),
      updatedAt: Number(r.updatedAt),
    })) as T[];
  }
  if (store === "chat_messages") {
    return rows.map((r) => ({
      id: r.id,
      threadId: (r.threadId as string) ?? "",
      role: (r.role as string) ?? "",
      content: (r.content as string) ?? "",
      sourceNodeId: (r.sourceNodeId as string) ?? undefined,
      sourceTitle: (r.sourceTitle as string) ?? undefined,
      createdAt: Number(r.createdAt),
    })) as T[];
  }
  return rows.map((r) => JSON.parse((r.data as string) ?? "{}")) as T[];
}

export async function getAllFromIndex<T = unknown>(
  store: StoreName,
  index: string,
  query?: string,
): Promise<T[]> {
  if (index !== "tabId" || (store !== "nodes" && store !== "edges"))
    throw new Error("getAllFromIndex only supports tabId on nodes/edges");
  const rows = await execQuery<Record<string, unknown>>(
    `SELECT * FROM ${store} WHERE tabId = ?`,
    [query ?? ""],
  );
  return rows.map((r) => JSON.parse((r.data as string) ?? "{}")) as T[];
}

export async function put<T = unknown>(
  store: StoreName,
  value: T & { id?: string; k?: string },
): Promise<string> {
  const table = store;
  if (store === "media") {
    const v = value as unknown as MediaRecord;
    const base64 = await blobToBase64(v.blob);
    await exec(
      `INSERT OR REPLACE INTO media (id, blobBase64, mime, size, createdAt, fileName)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        v.id,
        base64,
        v.mime,
        String(v.size),
        String(v.createdAt),
        v.fileName ?? null,
      ],
    );
    return v.id;
  }
  if (store === "meta") {
    const v = value as unknown as MetaRecord;
    await exec(`INSERT OR REPLACE INTO meta (k, v) VALUES (?, ?)`, [
      v.k,
      JSON.stringify(v.v),
    ]);
    return v.k;
  }
  if (store === "tabs") {
    const v = value as unknown as TabRecord;
    await exec(
      `INSERT OR REPLACE INTO tabs (id, title, iconKey, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?)`,
      [
        v.id,
        v.title,
        v.iconKey ?? null,
        String(v.createdAt),
        String(v.updatedAt),
      ],
    );
    return v.id;
  }
  if (store === "node_text") {
    const v = value as unknown as NodeTextRecord;
    await exec(
      `INSERT OR REPLACE INTO node_text (nodeId, plainText, updatedAt)
       VALUES (?, ?, ?)`,
      [v.nodeId, v.plainText, String(v.updatedAt)],
    );
    return v.nodeId;
  }
  if (store === "chat_threads") {
    const v = value as unknown as ChatThreadRecord;
    await exec(
      `INSERT OR REPLACE INTO chat_threads (id, title, createdAt, updatedAt)
       VALUES (?, ?, ?, ?)`,
      [v.id, v.title, String(v.createdAt), String(v.updatedAt)],
    );
    return v.id;
  }
  if (store === "chat_messages") {
    const v = value as unknown as ChatMessageRecord;
    await exec(
      `INSERT OR REPLACE INTO chat_messages (id, threadId, role, content, sourceNodeId, sourceTitle, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        v.id,
        v.threadId,
        v.role,
        v.content,
        v.sourceNodeId ?? null,
        v.sourceTitle ?? null,
        String(v.createdAt),
      ],
    );
    return v.id;
  }
  const record = value as unknown as {
    id: string;
    tabId: string;
    [k: string]: unknown;
  };
  const id = record.id;
  const tabId = record.tabId;
  await exec(
    `INSERT OR REPLACE INTO ${table} (id, tabId, data) VALUES (?, ?, ?)`,
    [id, tabId, JSON.stringify(record)],
  );
  return id;
}

export async function add<T = unknown>(
  store: StoreName,
  value: T & { id?: string; k?: string },
): Promise<string> {
  const table = store;
  if (store === "media") {
    const v = value as unknown as MediaRecord;
    const base64 = await blobToBase64(v.blob);
    await exec(
      `INSERT INTO media (id, blobBase64, mime, size, createdAt, fileName)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        v.id,
        base64,
        v.mime,
        String(v.size),
        String(v.createdAt),
        v.fileName ?? null,
      ],
    );
    return v.id;
  }
  if (store === "meta") {
    const v = value as unknown as MetaRecord;
    await exec(`INSERT INTO meta (k, v) VALUES (?, ?)`, [
      v.k,
      JSON.stringify(v.v),
    ]);
    return v.k;
  }
  if (store === "tabs") {
    const v = value as unknown as TabRecord;
    await exec(
      `INSERT INTO tabs (id, title, iconKey, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?)`,
      [
        v.id,
        v.title,
        v.iconKey ?? null,
        String(v.createdAt),
        String(v.updatedAt),
      ],
    );
    return v.id;
  }
  if (store === "node_text") {
    const v = value as unknown as NodeTextRecord;
    await exec(
      `INSERT INTO node_text (nodeId, plainText, updatedAt) VALUES (?, ?, ?)`,
      [v.nodeId, v.plainText, String(v.updatedAt)],
    );
    return v.nodeId;
  }
  if (store === "chat_threads") {
    const v = value as unknown as ChatThreadRecord;
    await exec(
      `INSERT INTO chat_threads (id, title, createdAt, updatedAt) VALUES (?, ?, ?, ?)`,
      [v.id, v.title, String(v.createdAt), String(v.updatedAt)],
    );
    return v.id;
  }
  if (store === "chat_messages") {
    const v = value as unknown as ChatMessageRecord;
    await exec(
      `INSERT INTO chat_messages (id, threadId, role, content, sourceNodeId, sourceTitle, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        v.id,
        v.threadId,
        v.role,
        v.content,
        v.sourceNodeId ?? null,
        v.sourceTitle ?? null,
        String(v.createdAt),
      ],
    );
    return v.id;
  }
  const record = value as unknown as {
    id: string;
    tabId: string;
    [k: string]: unknown;
  };
  await exec(`INSERT INTO ${table} (id, tabId, data) VALUES (?, ?, ?)`, [
    record.id,
    record.tabId,
    JSON.stringify(record),
  ]);
  return record.id;
}

export async function deleteKey(store: StoreName, key: string): Promise<void> {
  const col = keyColumn[store];
  const table = store;
  await exec(`DELETE FROM ${table} WHERE ${col} = ?`, [key]);
}

export async function bulkPut<T = unknown>(
  store: StoreName,
  values: (T & { id?: string; k?: string })[],
): Promise<void> {
  if (values.length === 0) return;

  if (store === "media") {
    for (const v of values as unknown as MediaRecord[]) {
      await put(store, v);
    }
    return;
  }
  if (store === "meta") {
    for (const v of values as unknown as MetaRecord[]) {
      await put(store, v);
    }
    return;
  }
  if (store === "tabs") {
    const placeholders = values.map(() => "(?, ?, ?, ?, ?)").join(", ");
    const bind: (string | number | null)[] = [];
    for (const v of values as unknown as TabRecord[]) {
      bind.push(v.id, v.title, v.iconKey ?? null, v.createdAt, v.updatedAt);
    }
    await exec(
      `INSERT OR REPLACE INTO tabs (id, title, iconKey, createdAt, updatedAt) VALUES ${placeholders}`,
      bind,
    );
    return;
  }
  if (store === "node_text") {
    const placeholders = values.map(() => "(?, ?, ?)").join(", ");
    const bind: (string | number | null)[] = [];
    for (const v of values as unknown as NodeTextRecord[]) {
      bind.push(v.nodeId, v.plainText, v.updatedAt);
    }
    await exec(
      `INSERT OR REPLACE INTO node_text (nodeId, plainText, updatedAt) VALUES ${placeholders}`,
      bind,
    );
    return;
  }
  if (store === "chat_threads") {
    const placeholders = values.map(() => "(?, ?, ?, ?)").join(", ");
    const bind: (string | number | null)[] = [];
    for (const v of values as unknown as ChatThreadRecord[]) {
      bind.push(v.id, v.title, v.createdAt, v.updatedAt);
    }
    await exec(
      `INSERT OR REPLACE INTO chat_threads (id, title, createdAt, updatedAt) VALUES ${placeholders}`,
      bind,
    );
    return;
  }
  if (store === "chat_messages") {
    const placeholders = values
      .map(() => "(?, ?, ?, ?, ?, ?, ?)")
      .join(", ");
    const bind: (string | number | null)[] = [];
    for (const v of values as unknown as ChatMessageRecord[]) {
      bind.push(
        v.id,
        v.threadId,
        v.role,
        v.content,
        v.sourceNodeId ?? null,
        v.sourceTitle ?? null,
        v.createdAt,
      );
    }
    await exec(
      `INSERT OR REPLACE INTO chat_messages (id, threadId, role, content, sourceNodeId, sourceTitle, createdAt) VALUES ${placeholders}`,
      bind,
    );
    return;
  }

  const placeholders = values.map(() => "(?, ?, ?)").join(", ");
  const bind: (string | number | null)[] = [];
  for (const v of values as unknown as {
    id: string;
    tabId: string;
    [k: string]: unknown;
  }[]) {
    bind.push(v.id, v.tabId, JSON.stringify(v));
  }
  await exec(
    `INSERT OR REPLACE INTO ${store} (id, tabId, data) VALUES ${placeholders}`,
    bind,
  );
}

export async function bulkDelete(
  store: StoreName,
  keys: (string | number)[],
): Promise<void> {
  if (keys.length === 0) return;
  const col = keyColumn[store];
  const table = store;
  const placeholders = keys.map(() => "?").join(", ");
  await exec(
    `DELETE FROM ${table} WHERE ${col} IN (${placeholders})`,
    keys.map(String),
  );
}

export async function clearStore(store: StoreName): Promise<void> {
  await exec(`DELETE FROM ${store}`);
}

export const Stores = {
  nodes: "nodes" as StoreName,
  edges: "edges" as StoreName,
  media: "media" as StoreName,
  meta: "meta" as StoreName,
  tabs: "tabs" as StoreName,
  node_text: "node_text" as StoreName,
  chat_threads: "chat_threads" as StoreName,
  chat_messages: "chat_messages" as StoreName,
};

/** True when OPFS was unavailable and we fell back to :memory: (no persistence). */
export function isUsingMemoryFallback(): boolean {
  return usingMemoryFallback;
}

// Best-effort: on tab close/reload, ask sqlite3 worker to close the DB so that
// any OPFS access handles are released promptly. This reduces the likelihood
// of OPFS "Access Handles cannot be created" errors in subsequently opened tabs.
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    void closeDb();
  });
}
