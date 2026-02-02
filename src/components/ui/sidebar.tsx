"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
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
}: React.ComponentProps<typeof SheetContent> & {
  children: React.ReactNode;
}) => {
  const { open, setOpen } = useSidebar();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        hideOverlay
        className={cn("w-[320px] sm:max-w-[320px] p-0 gap-0", className)}
        {...props}
      >
        <SheetTitle className="sr-only">Chat</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
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
