"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

const SidebarProvider = ({
  children,
  defaultOpen = false,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = React.useState(defaultOpen);
  const state = open ? "expanded" : "collapsed";
  const toggleSidebar = React.useCallback(
    () => setOpen((open) => !open),
    [setOpen]
  );

  return (
    <SidebarContext.Provider value={{ open, setOpen, state, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

const ChatSidebarTrigger = () => {
  const { toggleSidebar, state } = useSidebar();

  return (
    <Button
      className="w-8 h-14 cursor-pointer rounded-r-none border-2 border-r-0 border-gray-300"
      onClick={toggleSidebar}
    >
      {state === "expanded" ? (
        <ChevronRightIcon className="w-8 h-8" />
      ) : (
        <ChevronLeftIcon className="w-8 h-8" />
      )}
    </Button>
  );
};

const Sidebar = ({
  children,
  className,
  ...props
}: React.ComponentProps<"aside"> & {
  children: React.ReactNode;
}) => {
  const { open } = useSidebar();
  return (
    <div
      className={cn(
        "relative flex-shrink-0 h-full overflow-visible transition-[width] duration-300 ease-in-out",
        open ? "w-[400px]" : "w-0"
      )}
    >
      <div className="absolute left-[1px] top-1/2 -translate-x-full -translate-y-1/2 z-[49] pointer-events-auto">
        <ChatSidebarTrigger />
      </div>
      <aside
        className={cn(
          "flex h-full w-full flex-col border-l bg-background overflow-hidden",
          className
        )}
        {...props}
      >
        <div className={cn("min-h-full", !open && "invisible")}>{children}</div>
      </aside>
    </div>
  );
};

const SidebarInset = ({
  className,
  ...props
}: React.ComponentProps<"main">) => {
  return (
    <main
      data-sidebar="inset"
      className={cn("flex-1 flex flex-col min-w-0 min-h-0", className)}
      {...props}
    />
  );
};

export { SidebarProvider, Sidebar, SidebarInset, useSidebar };
