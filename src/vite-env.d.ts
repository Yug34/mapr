/// <reference types="vite/client" />

// WebGPU API type definitions (minimal for Navigator.gpu)
interface Navigator {
  gpu?: GPU;
}

interface GPU {
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
}

interface GPURequestAdapterOptions {
  powerPreference?: "low-power" | "high-performance";
  forceFallbackAdapter?: boolean;
}

interface GPUAdapter {
  readonly features: ReadonlySet<string>;
  readonly limits: Record<string, number>;
  requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
}

interface GPUDeviceDescriptor {
  label?: string;
  requiredFeatures?: string[];
  requiredLimits?: Record<string, number>;
}

interface GPUDevice extends EventTarget {
  readonly features: ReadonlySet<string>;
  readonly limits: Record<string, number>;
  readonly lost: Promise<GPUDeviceLostInfo>;
  readonly queue: GPUQueue;
  destroy(): void;
}

interface GPUDeviceLostInfo {
  readonly reason: "destroyed" | "unknown";
  readonly message: string;
}

interface GPUQueue {
  submit(commandBuffers: unknown[]): void;
  onSubmittedWorkDone(): Promise<void>;
  setLabel(label?: string): void;
}
