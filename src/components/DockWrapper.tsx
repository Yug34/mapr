import { HomeIcon, Plus, TrashIcon } from "lucide-react";
import { Dock, DockIcon, DockItem, DockLabel } from "@/components/ui/dock";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "./ui/dialog";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useCanvasStore } from "../store/canvasStore";
import { generate } from "random-words";

const tabStyle = "h-full w-full text-neutral-600 dark:text-neutral-300";

export default function DockWrapper() {
  const {
    tabs,
    activeTabId,
    setActiveTab,
    addTab: addTabToStore,
    deleteTab: deleteTabFromStore,
  } = useCanvasStore();

  const [newTabTitle, setNewTabTitle] = useState(
    generate({ exactly: 2, minLength: 3, maxLength: 6, join: "-" })
  );
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [isAddTabDialogOpen, setIsAddTabDialogOpen] = useState(false);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleAddTab = async () => {
    if (isAddingTab) return;
    setIsAddingTab(true);
    try {
      await addTabToStore(newTabTitle);
      setNewTabTitle(
        generate({ exactly: 2, minLength: 3, maxLength: 6, join: "-" })
      );
      setIsAddTabDialogOpen(false); // Close the dialog after successful addition
    } catch (error) {
      console.error("Failed to add tab:", error);
    } finally {
      setIsAddingTab(false);
    }
  };

  const handleDeleteTab = async () => {
    try {
      await deleteTabFromStore(activeTabId);
    } catch (error) {
      console.error("Failed to delete tab:", error);
    }
  };

  return (
    <div className="absolute bottom-2 left-1/2 max-w-full -translate-x-1/2">
      <Dock className="items-end pb-3">
        {tabs.map((tab) => (
          <span
            className="cursor-pointer"
            onClick={() => handleTabClick(tab.id)}
            key={tab.id}
          >
            <DockItem
              className={`aspect-square rounded-full ${
                activeTabId === tab.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300 dark:bg-neutral-800"
              }`}
            >
              <DockLabel>{tab.title}</DockLabel>
              <DockIcon>
                <HomeIcon
                  className={tabStyle}
                  style={activeTabId === tab.id ? { color: "white" } : {}}
                />
              </DockIcon>
            </DockItem>
          </span>
        ))}
        <Dialog open={isAddTabDialogOpen} onOpenChange={setIsAddTabDialogOpen}>
          <DialogTrigger asChild>
            <span className="cursor-pointer">
              <DockItem className="aspect-square rounded-full bg-gray-300 dark:bg-neutral-800">
                <DockLabel>Add Tab</DockLabel>
                <DockIcon>
                  <Plus className={tabStyle} />
                </DockIcon>
              </DockItem>
            </span>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tab</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={newTabTitle}
                onChange={(e) => setNewTabTitle(e.target.value)}
                className="px-3 py-2 border rounded-md"
                placeholder="Tab title"
              />
              <DialogClose asChild>
                <Button
                  onClick={handleAddTab}
                  className="cursor-pointer"
                  disabled={isAddingTab || !newTabTitle.trim()}
                >
                  {isAddingTab ? "Adding..." : "Add Tab"}
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
        <Separator orientation="vertical" />
        <Dialog>
          <DialogTrigger asChild>
            <span className="cursor-pointer">
              <DockItem className="aspect-square rounded-full bg-red-500 dark:bg-red-500 text-white">
                <DockLabel>Delete Current Tab</DockLabel>
                <DockIcon>
                  <TrashIcon color="white" className={tabStyle} />
                </DockIcon>
              </DockItem>
            </span>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Tab</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <p className="text-sm py-2 px-4">
                Are you sure you want to delete this tab? All nodes and edges in
                this tab will be permanently deleted.
              </p>
              <DialogClose asChild>
                <Button
                  variant="destructive"
                  disabled={tabs.length <= 1}
                  onClick={handleDeleteTab}
                  className="cursor-pointer mt-2"
                >
                  {tabs.length <= 1 ? "Cannot delete last tab" : "Delete Tab"}
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </Dock>
    </div>
  );
}
