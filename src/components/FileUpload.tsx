import { UploadIcon } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useCanvasStore } from "../store/canvasStore";
import { useRef, useEffect } from "react";

export default function ImageUpload() {
  const { dragging, setDragging } = useCanvasStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const inputRef = fileInputRef.current;
    const dropHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(e);
      setDragging(false);
    };
    if (inputRef) {
      inputRef.addEventListener("drop", dropHandler);
    }

    return () => {
      if (inputRef) {
        inputRef.removeEventListener("drop", dropHandler);
      }
    };
  }, [fileInputRef]);

  return dragging ? (
    <div
      className={"flex flex-col h-full justify-center items-start opacity-50"}
    >
      <Card>
        <CardHeader>
          <CardTitle className="mb-3 flex justify-between items-center">
            <div>Add files to the canvas</div>
          </CardTitle>
        </CardHeader>

        <CardContent ref={fileInputRef}>
          <Label htmlFor="dropzone-file" className={"cursor-pointer"}>
            <Card className="flex p-4 items-center justify-center w-full brightness-[0.95] hover:brightness-[0.90] min-w-[300px] md:min-w-[600px] dark:brightness-125 dark:hover:brightness-150">
              <div className="text-center w-full">
                <div className="border p-2 rounded-md max-w-min mx-auto">
                  <UploadIcon />
                </div>

                <p className="my-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">
                    Drop your files here to add them to the canvas
                  </span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-400">
                  Images, Videos, Audio, PDFs supported!
                </p>
              </div>
            </Card>
          </Label>

          <Input
            id="dropzone-file"
            accept="image/png, image/jpeg, image/webp, video/mp4, video/webm, application/pdf"
            type="file"
            className="hidden"
            onChange={(e) => {
              e.preventDefault();
              setDragging(false);
            }}
          />
        </CardContent>
      </Card>
    </div>
  ) : null;
}
