import { UploadIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function FileUpload() {
  return (
    <div className={"flex flex-col h-full justify-center items-start"}>
      <Card>
        <CardContent>
          <Label htmlFor="dropzone-file" className={"cursor-pointer"}>
            <Card className="flex p-4 items-center justify-center w-full brightness-[0.95] hover:brightness-[0.90] min-w-[300px] md:min-w-[600px] dark:brightness-125 dark:hover:brightness-150">
              <div className="text-center w-full">
                <div className="border p-2 rounded-md max-w-min mx-auto">
                  <UploadIcon />
                </div>

                <p className="my-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">
                    Click here to upload an image
                  </span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-400">
                  Formats supported: PNG, JPG, WebP
                </p>
              </div>
            </Card>
          </Label>

          <Input
            id="dropzone-file"
            accept="image/png, image/jpeg, image/webp"
            type="file"
            className="hidden"
            onChange={(e) => {
              console.log(e);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
