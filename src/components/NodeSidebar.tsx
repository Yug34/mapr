import {
  SheetHeader,
  SheetDescription,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "./ui/sheet";

const NodeSidebar = () => {
  return (
    <div className="w-[200px] h-full bg-red-500 flex-shrink-0">
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Add Node</SheetTitle>
            <SheetDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default NodeSidebar;
