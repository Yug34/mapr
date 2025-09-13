export type StoreName = "nodes" | "edges" | "media" | "meta" | "images";

export type TxMode = IDBTransactionMode;

export type EdgeRecord = {
  id: string;
  source: string;
  target: string;
  [extra: string]: unknown;
};

export type MediaRecord = {
  id: string;
  blob: Blob;
  mime: string;
  size: number;
  createdAt: number;
};

export type MetaRecord = { k: string; v: unknown };

const DB_NAME = "CanvasDB";
const DB_VERSION = 2;

let dbPromise: Promise<IDBDatabase> | null = null;

function ensureStores(db: IDBDatabase, oldVersion: number) {
  if (!db.objectStoreNames.contains("images")) {
    db.createObjectStore("images", { keyPath: "url" });
  }

  if (!db.objectStoreNames.contains("nodes")) {
    db.createObjectStore("nodes", { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains("edges")) {
    const edges = db.createObjectStore("edges", { keyPath: "id" });
    edges.createIndex("source", "source", { unique: false });
    edges.createIndex("target", "target", { unique: false });
  }
  if (!db.objectStoreNames.contains("media")) {
    db.createObjectStore("media", { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains("meta")) {
    db.createObjectStore("meta", { keyPath: "k" });
  }

  if (oldVersion < 2) {
    try {
      const tx = db.transaction(["images", "meta"], "readwrite");
      const images = tx.objectStore("images");
      const meta = tx.objectStore("meta");
      const migratedFlagReq = meta.get("migrated_images_v1");
      migratedFlagReq.onsuccess = () => {
        const alreadyMigrated = migratedFlagReq.result?.v === true;
        if (alreadyMigrated) return;
        const getAllReq = images.getAll();
        getAllReq.onsuccess = () => {
          const entries = Array.isArray(getAllReq.result)
            ? getAllReq.result
            : [];
          if (!entries.length) {
            meta.put({ k: "migrated_images_v1", v: true } as MetaRecord);
            return;
          }
          meta.put({ k: "migrated_images_v1", v: true } as MetaRecord);
        };
      };
    } catch {
      // ignore
    }
  }
}

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = (ev) => {
      const db = req.result;
      ensureStores(db, (ev.oldVersion as number) ?? 0);
    };
    req.onsuccess = () => resolve(req.result);
  });
  return dbPromise;
}

export async function withTransaction<T>(
  storeNames: StoreName[] | StoreName,
  mode: TxMode,
  handler: (tx: IDBTransaction) => Promise<T>
): Promise<T> {
  const db = await openDb();
  const names = Array.isArray(storeNames) ? storeNames : [storeNames];
  const tx = db.transaction(names, mode);
  return handler(tx).finally(
    () =>
      new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

export async function get<T = unknown>(store: StoreName, key: IDBValidKey) {
  return withTransaction<T | undefined>(store, "readonly", async (tx) => {
    const os = tx.objectStore(store);
    return new Promise<T | undefined>((resolve, reject) => {
      const r = os.get(key);
      r.onsuccess = () => resolve(r.result as T | undefined);
      r.onerror = () => reject(r.error);
    });
  });
}

export async function getAll<T = unknown>(store: StoreName) {
  return withTransaction<T[]>(store, "readonly", async (tx) => {
    const os = tx.objectStore(store);
    return new Promise<T[]>((resolve, reject) => {
      const r = os.getAll();
      r.onsuccess = () => resolve((r.result as T[]) || []);
      r.onerror = () => reject(r.error);
    });
  });
}

export async function getAllFromIndex<T = unknown>(
  store: StoreName,
  index: string,
  query?: IDBKeyRange | IDBValidKey
) {
  return withTransaction<T[]>(store, "readonly", async (tx) => {
    const os = tx.objectStore(store);
    const idx = os.index(index);
    return new Promise<T[]>((resolve, reject) => {
      const r = idx.getAll(query as never);
      r.onsuccess = () => resolve((r.result as T[]) || []);
      r.onerror = () => reject(r.error);
    });
  });
}

export async function put<T = unknown>(store: StoreName, value: T) {
  return withTransaction<IDBValidKey>(store, "readwrite", async (tx) => {
    const os = tx.objectStore(store);
    return new Promise<IDBValidKey>((resolve, reject) => {
      const r = os.put(value as unknown as IDBValidKey);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  });
}

export async function add<T = unknown>(store: StoreName, value: T) {
  return withTransaction<IDBValidKey>(store, "readwrite", async (tx) => {
    const os = tx.objectStore(store);
    return new Promise<IDBValidKey>((resolve, reject) => {
      const r = os.add(value as unknown as IDBValidKey);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  });
}

export async function deleteKey(store: StoreName, key: IDBValidKey) {
  return withTransaction<void>(store, "readwrite", async (tx) => {
    const os = tx.objectStore(store);
    return new Promise<void>((resolve, reject) => {
      const r = os.delete(key);
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });
  });
}

export async function bulkPut<T = unknown>(store: StoreName, values: T[]) {
  return withTransaction<void>(store, "readwrite", async (tx) => {
    const os = tx.objectStore(store);
    await Promise.all(
      values.map(
        (v) =>
          new Promise<void>((resolve, reject) => {
            const r = os.put(v as never);
            r.onsuccess = () => resolve();
            r.onerror = () => reject(r.error);
          })
      )
    );
  });
}

export async function bulkDelete(store: StoreName, keys: IDBValidKey[]) {
  return withTransaction<void>(store, "readwrite", async (tx) => {
    const os = tx.objectStore(store);
    await Promise.all(
      keys.map(
        (k) =>
          new Promise<void>((resolve, reject) => {
            const r = os.delete(k);
            r.onsuccess = () => resolve();
            r.onerror = () => reject(r.error);
          })
      )
    );
  });
}

export async function clearStore(store: StoreName) {
  return withTransaction<void>(store, "readwrite", async (tx) => {
    const os = tx.objectStore(store);
    return new Promise<void>((resolve, reject) => {
      const r = os.clear();
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });
  });
}

export const Stores = {
  nodes: "nodes" as StoreName,
  edges: "edges" as StoreName,
  media: "media" as StoreName,
  meta: "meta" as StoreName,
  images: "images" as StoreName,
};
