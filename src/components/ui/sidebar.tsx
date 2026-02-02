"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface SidebarContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

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
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
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

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, onClick, ...props }, ref) => {
  const { setOpen } = useSidebar();
  return (
    <button
      ref={ref}
      type="button"
      aria-label="Toggle sidebar"
      className={cn(className)}
      onClick={(e) => {
        setOpen(true);
        onClick?.(e);
      }}
      {...props}
    />
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

export { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, useSidebar };
