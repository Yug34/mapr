import { HomeIcon, Plus, SettingsIcon } from "lucide-react";
import { Dock, DockIcon, DockItem, DockLabel } from "@/components/ui/dock";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { DialogTrigger } from "@radix-ui/react-dialog";

type Tab = {
  title: string;
  icon: React.ReactNode;
  href: string;
};

const tabStyle = "h-full w-full text-neutral-600 dark:text-neutral-300";
const tabsData: Tab[] = [
  {
    title: "Home",
    icon: <HomeIcon className={tabStyle} />,
    href: "#",
  },
];

export default function DockWrapper() {
  const [tabs, setTabs] = useState<Tab[]>(tabsData);
  const [activeTab, setActiveTab] = useState<Tab>(tabsData[0]);

  const addTab = () => {
    setTabs([
      ...tabs,
      {
        title: "New Tab",
        icon: <HomeIcon className={tabStyle} />,
        href: "#",
      },
    ]);
  };

  const handleClick = (item: Tab) => {
    setActiveTab(item);
  };

  useEffect(() => {
    console.log(activeTab);
  }, [activeTab]);

  return (
    <div className="absolute bottom-2 left-1/2 max-w-full -translate-x-1/2">
      <Dock className="items-end pb-3">
        {tabs.map((item, idx) => (
          <span
            className="cursor-pointer"
            onClick={() => handleClick(item)}
            key={idx}
          >
            <DockItem
              key={idx}
              className="aspect-square rounded-full bg-gray-200 dark:bg-neutral-800"
            >
              <DockLabel>{item.title}</DockLabel>
              <DockIcon>{item.icon}</DockIcon>
            </DockItem>
          </span>
        ))}
        <span className="cursor-pointer" onClick={addTab}>
          <DockItem className="aspect-square rounded-full bg-gray-200 dark:bg-neutral-800">
            <DockLabel>Add Tab</DockLabel>
            <DockIcon>
              <Plus className={tabStyle} />
            </DockIcon>
          </DockItem>
        </span>
        <Dialog>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Tab</DialogTitle>
            </DialogHeader>
          </DialogContent>
          <DialogTrigger>
            <span className="cursor-pointer">
              <DockItem className="aspect-square rounded-full bg-gray-200 dark:bg-neutral-800">
                <DockLabel>Settings</DockLabel>
                <DockIcon>
                  <SettingsIcon className={tabStyle} />
                </DockIcon>
              </DockItem>
            </span>
          </DialogTrigger>
        </Dialog>
      </Dock>
    </div>
  );
}
