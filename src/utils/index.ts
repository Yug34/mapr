const isLink = (text: string) => {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
};

const readAsDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export { isLink, readAsDataURL };
export { blobManager } from "./blobManager";
