import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MousePointer2,
  Move,
  Link2,
  Hand,
  Plus,
  FileText,
  Image,
  Video,
  Music,
  FileType,
  CheckSquare,
  ArrowRight,
  ArrowLeft,
  X,
  Github,
} from "lucide-react";

const WALKTHROUGH_STORAGE_KEY = "mapr-walkthrough-completed";

interface WalkthroughStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const steps: WalkthroughStep[] = [
  {
    title: "Welcome to Mapr!",
    description: "Your personal mind mapping canvas",
    icon: <Hand className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-foreground">
          I used to use a mind map app called <strong>Edvo</strong>. Unfortunately, they shut down :(
        </p>
        <p className="text-foreground">
          So I made this for myself :D
        </p>
        <p className="text-foreground">
          You can add nodes for text, images, videos, audio, PDFs, and make TODOs.
        </p>
        <div className="flex items-center gap-2 pt-2">
          <Github className="h-4 w-4" />
          <a
            href="https://github.com/yug34/mapr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Source code on GitHub
          </a>
        </div>
      </div>
    ),
  },
  {
    title: "Add New Nodes",
    description: "Right-click anywhere on the canvas",
    icon: <Plus className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-foreground">
          Right-click on the canvas to open the context menu and add new nodes.
        </p>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Card>
            <CardHeader className="pb-2">
              <FileText className="h-5 w-5 mb-1" />
              <CardTitle className="text-sm">Text Notes</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Image className="h-5 w-5 mb-1" />
              <CardTitle className="text-sm">Images</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Video className="h-5 w-5 mb-1" />
              <CardTitle className="text-sm">Videos</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Music className="h-5 w-5 mb-1" />
              <CardTitle className="text-sm">Audio</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <FileType className="h-5 w-5 mb-1" />
              <CardTitle className="text-sm">PDFs</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CheckSquare className="h-5 w-5 mb-1" />
              <CardTitle className="text-sm">TODOs</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    ),
  },
  {
    title: "Move Nodes",
    description: "Click and drag to reposition",
    icon: <Move className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-foreground">
          Click on any node and drag it to move it around the canvas. Arrange your content however you like!
        </p>
      </div>
    ),
  },
  {
    title: "Node Actions",
    description: "Right-click on nodes for more options",
    icon: <MousePointer2 className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-foreground">
          Right-click on any node to access additional actions:
        </p>
        <ul className="list-disc list-inside space-y-2 text-foreground">
          <li><strong>Duplicate</strong> - Create a copy of the node</li>
          <li><strong>Delete</strong> - Remove the node from the canvas</li>
        </ul>
      </div>
    ),
  },
  {
    title: "Connect Nodes",
    description: "Create relationships between nodes",
    icon: <Link2 className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-foreground">
          Connect nodes by clicking and dragging from a handle (the small dots) on one node to a handle on another node.
        </p>
        <p className="text-foreground">
          This creates visual relationships between your content items.
        </p>
      </div>
    ),
  },
  {
    title: "Navigate the Canvas",
    description: "Figma-like pan and zoom controls",
    icon: <Hand className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-foreground">
          Navigate around your canvas using familiar controls:
        </p>
        <ul className="list-disc list-inside space-y-2 text-foreground">
          <li><strong>Scroll</strong> - Zoom in and out</li>
          <li><strong>Space + Drag</strong> - Pan around the canvas</li>
          <li><strong>Controls</strong> - Use the zoom controls in the bottom-right corner</li>
        </ul>
      </div>
    ),
  },
];

export function Walkthrough() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasCompletedWalkthrough = localStorage.getItem(WALKTHROUGH_STORAGE_KEY);
    if (!hasCompletedWalkthrough) {
      // Small delay to ensure the app is fully loaded
      const timer = setTimeout(() => {
        setOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(WALKTHROUGH_STORAGE_KEY, "true");
    setOpen(false);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleComplete();
      }
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {currentStepData.icon}
            </div>
            <div className="flex-1">
              <DialogTitle>{currentStepData.title}</DialogTitle>
              <DialogDescription>{currentStepData.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {currentStepData.content}
        </div>

        <div className="flex items-center justify-between w-full flex-row">
          <DialogFooter className="w-full flex flex-row justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <div className="flex gap-1 items-center">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    index === currentStep
                      ? "bg-primary w-6"
                      : "bg-primary/30 cursor-pointer hover:bg-primary/50"
                  }`}
                  onClick={() => setCurrentStep(index)}
                />
              ))}
            </div>
            <Button className="cursor-pointer" onClick={handleNext}>
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export function to manually trigger walkthrough (for testing or help menu)
export function showWalkthrough() {
  localStorage.removeItem(WALKTHROUGH_STORAGE_KEY);
  window.location.reload();
}

