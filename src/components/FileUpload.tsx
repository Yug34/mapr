import { useEffect, useState } from "react";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "./ui/dropzone";
import { readAsDataURL } from "@/utils";
import { add as idbAdd, Stores } from "@/utils/indexedDb";
import { MEDIA_HANDLERS } from "@/lib/utils";
import type { MediaHandler, CustomNodeData, CustomNode } from "@/types/common";
import { useCanvas } from "@/hooks/useCanvas";
import { blobManager } from "@/utils/blobManager";

export default function FileUpload() {
  const [files, setFiles] = useState<File[] | undefined>();
  const { addNode } = useCanvas();

  useEffect(() => {
    if (files) {
      let displacement = 0;
      files.forEach(async (file) => {
        const handler = MEDIA_HANDLERS.find((h: MediaHandler<CustomNodeData>) =>
          h.test(file.type)
        );
        if (!handler) return;

        const nodeId = crypto.randomUUID();
        const blobUrl = blobManager.createBlobUrl(file, nodeId);
        const base64 = await readAsDataURL(file);

        const mediaId = crypto.randomUUID();
        await idbAdd(Stores.media, {
          id: mediaId,
          fileName: file.name,
          blob: file,
          mime: file.type,
          size: file.size,
          createdAt: Date.now(),
        });

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
          },
        } as CustomNode;

        addNode(node);
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
