import { create } from "zustand";

export type ExtractionStatus = "idle" | "extracting" | "done" | "error";

interface ExtractionState {
  statusByNodeId: Record<string, ExtractionStatus>;
  errorByNodeId: Record<string, string>;
  setStatus: (nodeId: string, status: ExtractionStatus) => void;
  setError: (nodeId: string, message: string) => void;
  clearStatus: (nodeId: string) => void;
  clearAll: () => void;
}

export const useExtractionStore = create<ExtractionState>((set) => ({
  statusByNodeId: {},
  errorByNodeId: {},
  setStatus: (nodeId, status) =>
    set((state) => {
      const newState: Partial<ExtractionState> = {
        statusByNodeId: { ...state.statusByNodeId, [nodeId]: status },
      };
      if (status !== "error") {
        const { [nodeId]: _, ...restError } = state.errorByNodeId;
        newState.errorByNodeId = restError;
      }
      return newState;
    }),
  setError: (nodeId, message) =>
    set((state) => ({
      statusByNodeId: { ...state.statusByNodeId, [nodeId]: "error" },
      errorByNodeId: { ...state.errorByNodeId, [nodeId]: message },
    })),
  clearStatus: (nodeId) =>
    set((state) => {
      const { [nodeId]: _, ...restStatus } = state.statusByNodeId;
      const { [nodeId]: __, ...restError } = state.errorByNodeId;
      return { statusByNodeId: restStatus, errorByNodeId: restError };
    }),
  clearAll: () => set({ statusByNodeId: {}, errorByNodeId: {} }),
}));
