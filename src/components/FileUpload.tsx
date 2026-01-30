import { useEffect, useState } from "react";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "./ui/dropzone";
import { readAsDataURL } from "@/utils";
import { add as dbAdd, Stores } from "@/utils/sqliteDb";
import { MEDIA_HANDLERS, stripFileExtension } from "@/lib/utils";
import type { MediaHandler, CustomNodeData, CustomNode } from "@/types/common";
import { useCanvas } from "@/hooks/useCanvas";
import { blobManager } from "@/utils/blobManager";
import { extractAndStoreNodeText } from "@/services/extractionService";

export default function FileUpload() {
  const [files, setFiles] = useState<File[] | undefined>();
  const { addNode } = useCanvas();

  useEffect(() => {
    if (files) {
      let displacement = 0;
      files.forEach(async (file) => {
        const handler = MEDIA_HANDLERS.find((h: MediaHandler<CustomNodeData>) =>
          h.test(file.type),
        );
        if (!handler) return;

        const nodeId = crypto.randomUUID();
        const blobUrl = blobManager.createBlobUrl(file, nodeId);
        const base64 = await readAsDataURL(file);

        const mediaId = crypto.randomUUID();
        await dbAdd(Stores.media, {
          id: mediaId,
          fileName: file.name,
          blob: file,
          mime: file.type,
          size: file.size,
          createdAt: Date.now(),
        });

        // Register Blob in blobManager so PDFNode can pass it directly to react-pdf
        blobManager.setMediaBlob(mediaId, file);

        displacement += 100;

        const node = {
          id: nodeId,
          type: handler.type,
          fileName: file.name,
          position: {
            x: 0 + displacement,
            y: 0 + displacement,
          },
          data: {
            ...handler.buildData(file, blobUrl, base64),
            mediaId,
            fileName: file.name,
            title: stripFileExtension(file.name),
          },
        } as CustomNode;

        addNode(node);
        if (node.type === "ImageNode" || node.type === "PDFNode") {
          void extractAndStoreNodeText(node.id, node.type, file);
        }
      });
    }
  }, [files, addNode]);

  const handleDrop = (files: File[]) => {
    setFiles(files);
  };

  return (
    <Dropzone
      className="cursor-pointer"
      accept={{
        "image/*": [],
        "application/pdf": [],
        "video/*": [],
        "audio/*": [],
      }}
      maxFiles={10}
      maxSize={1024 * 1024 * 10}
      minSize={1024}
      onDrop={handleDrop}
      onError={console.error}
      src={files}
    >
      <DropzoneEmptyState />
      <DropzoneContent />
    </Dropzone>
  );
}
