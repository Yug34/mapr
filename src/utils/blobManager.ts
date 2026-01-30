/** Media id → Blob for passing directly to react-pdf (avoids fetch/worker URL issues). */
export type MediaBlobById = Map<string, Blob>;

class BlobManager {
  private blobUrls = new Set<string>();
  private nodeBlobUrls = new Map<string, Set<string>>(); // nodeId -> Set<blobUrl>
  private mediaBlobById: MediaBlobById = new Map();

  createBlobUrl(blob: Blob, nodeId?: string): string {
    const blobUrl = URL.createObjectURL(blob);
    this.blobUrls.add(blobUrl);

    if (nodeId) {
      if (!this.nodeBlobUrls.has(nodeId)) {
        this.nodeBlobUrls.set(nodeId, new Set());
      }
      this.nodeBlobUrls.get(nodeId)!.add(blobUrl);
    }

    return blobUrl;
  }

  revokeBlobUrl(blobUrl: string): void {
    if (this.blobUrls.has(blobUrl)) {
      URL.revokeObjectURL(blobUrl);
      this.blobUrls.delete(blobUrl);

      for (const [nodeId, urls] of this.nodeBlobUrls.entries()) {
        if (urls.has(blobUrl)) {
          urls.delete(blobUrl);
          if (urls.size === 0) {
            this.nodeBlobUrls.delete(nodeId);
          }
          break;
        }
      }
    }
  }

  revokeNodeBlobUrls(nodeId: string): void {
    const urls = this.nodeBlobUrls.get(nodeId);
    if (urls) {
      for (const blobUrl of urls) {
        URL.revokeObjectURL(blobUrl);
        this.blobUrls.delete(blobUrl);
      }
      this.nodeBlobUrls.delete(nodeId);
    }
  }

  revokeAllBlobUrls(): void {
    for (const blobUrl of this.blobUrls) {
      URL.revokeObjectURL(blobUrl);
    }
    this.blobUrls.clear();
    this.nodeBlobUrls.clear();
    this.mediaBlobById.clear();
  }

  /** Populate in-memory Blobs from media records so PDFNode can pass Blob directly to react-pdf. */
  setMediaBlobsFromRecords(records: { id: string; blob: Blob }[]): void {
    this.mediaBlobById.clear();
    for (const m of records) {
      this.mediaBlobById.set(m.id, m.blob);
    }
  }

  /** Set a single media Blob without clearing the map. Used when adding new nodes. */
  setMediaBlob(mediaId: string, blob: Blob): void {
    this.mediaBlobById.set(mediaId, blob);
  }

  getMediaBlob(mediaId: string): Blob | undefined {
    return this.mediaBlobById.get(mediaId);
  }

  getBlobUrlCount(): number {
    return this.blobUrls.size;
  }

  isTracking(blobUrl: string): boolean {
    return this.blobUrls.has(blobUrl);
  }

  getNodeBlobUrls(nodeId: string): string[] {
    const urls = this.nodeBlobUrls.get(nodeId);
    return urls ? Array.from(urls) : [];
  }
}

// Singleton instance
export const blobManager = new BlobManager();

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    blobManager.revokeAllBlobUrls();
  });
}

export default blobManager;
