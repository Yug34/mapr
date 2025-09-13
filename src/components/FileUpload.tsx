import { useEffect, useState } from "react";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "./ui/dropzone";
import { readAsDataURL } from "@/utils";
import { add as idbAdd, Stores } from "@/utils/indexedDb";
import { MEDIA_HANDLERS } from "@/lib/utils";
import type { MediaHandler, CustomNodeData, CustomNode } from "@/types/common";
import { useCanvasStore } from "@/store/canvasStore";

interface FileUploadProps {
  newFilePoint?: { x: number; y: number };
}

export default function FileUpload({ newFilePoint }: FileUploadProps) {
  const [files, setFiles] = useState<File[] | undefined>();
  const { addNode } = useCanvasStore();

  useEffect(() => {
    console.log("newFilePoint", newFilePoint);

    if (files) {
      let displacement = 0;
      files.forEach(async (file) => {
        const handler = MEDIA_HANDLERS.find((h: MediaHandler<CustomNodeData>) =>
          h.test(file.type)
        );
        if (!handler) return;

        const blobUrl = URL.createObjectURL(file);
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
          id: crypto.randomUUID(),
          type: handler.type,
          fileName: file.name,
          position: {
            x: (newFilePoint?.x ?? 0) + displacement,
            y: (newFilePoint?.y ?? 0) + displacement,
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
  }, [files, addNode, newFilePoint]);

  const handleDrop = (files: File[]) => {
    setFiles(files);
  };

  return (
    <Dropzone
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
