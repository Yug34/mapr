/**
 * Blob URL Lifecycle Manager
 *
 * Manages the creation and cleanup of blob URLs to prevent memory leaks.
 * Tracks all created blob URLs and provides cleanup utilities.
 */

class BlobManager {
  private blobUrls = new Set<string>();
  private nodeBlobUrls = new Map<string, Set<string>>(); // nodeId -> Set<blobUrl>

  /**
   * Create a blob URL and track it
   * @param blob - The blob to create a URL for
   * @param nodeId - Optional node ID to associate with this blob URL
   * @returns The created blob URL
   */
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

  /**
   * Revoke a specific blob URL
   * @param blobUrl - The blob URL to revoke
   */
  revokeBlobUrl(blobUrl: string): void {
    if (this.blobUrls.has(blobUrl)) {
      URL.revokeObjectURL(blobUrl);
      this.blobUrls.delete(blobUrl);

      // Remove from node tracking
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

  /**
   * Revoke all blob URLs associated with a specific node
   * @param nodeId - The node ID to clean up blob URLs for
   */
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

  /**
   * Revoke all tracked blob URLs
   */
  revokeAllBlobUrls(): void {
    for (const blobUrl of this.blobUrls) {
      URL.revokeObjectURL(blobUrl);
    }
    this.blobUrls.clear();
    this.nodeBlobUrls.clear();
  }

  /**
   * Get the number of tracked blob URLs
   */
  getBlobUrlCount(): number {
    return this.blobUrls.size;
  }

  /**
   * Check if a blob URL is being tracked
   */
  isTracking(blobUrl: string): boolean {
    return this.blobUrls.has(blobUrl);
  }

  /**
   * Get all blob URLs associated with a node
   */
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
