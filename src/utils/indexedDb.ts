let db: IDBDatabase | null = null;

const request: IDBOpenDBRequest = indexedDB.open("CanvasDB", 1);

request.onerror = (event) => {
  console.error(`Database error: ${(event.target as IDBOpenDBRequest).error}`);
};

request.onsuccess = (event) => {
  db = (event.target as IDBOpenDBRequest).result;
};

request.onupgradeneeded = (event) => {
  const db = (event.target as IDBOpenDBRequest).result;

  const objectStore = db.createObjectStore("images", { keyPath: "url" });

  objectStore.createIndex("url", "url", { unique: true });

  objectStore.transaction.oncomplete = () => {
    // Store values in the newly created objectStore.
    const objectStore = db
      .transaction("images", "readwrite")
      .objectStore("images");
    objectStore.add({
      url: "https://example.com",
      image: "https://example.com",
    });
  };
};
