"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

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

const Sidebar = ({
  children,
  className,
  ...props
}: React.ComponentProps<"aside"> & {
  children: React.ReactNode;
}) => {
  const { open } = useSidebar();
  return (
    <aside
      className={cn(
        "flex h-full flex-shrink-0 flex-col border-l bg-background transition-[width] duration-300 ease-in-out overflow-hidden",
        open ? "w-[320px]" : "w-0",
        className
      )}
      {...props}
    >
      <div className={cn("w-[320px] min-h-full", !open && "invisible")}>
        {children}
      </div>
    </aside>
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
