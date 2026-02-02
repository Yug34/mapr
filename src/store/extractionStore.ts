import { create } from "zustand";

export type ExtractionStatus = "idle" | "extracting" | "done" | "error";

interface ExtractionState {
  statusByNodeId: Record<string, ExtractionStatus>;
  errorByNodeId: Record<string, string>;
  /** Node IDs that have extracted=1 in node_text (persisted, from DB). */
  extractedFromDb: Record<string, boolean>;
  setStatus: (nodeId: string, status: ExtractionStatus) => void;
  setError: (nodeId: string, message: string) => void;
  clearStatus: (nodeId: string) => void;
  clearAll: () => void;
  /** Hydrate status to "done" for nodes that already have extracted text in DB. */
  hydrateFromNodeText: (nodeIds: string[]) => void;
  /** Hydrate extractedFromDb from node_text records where extracted=1. */
  hydrateExtractedFromDb: (nodeIds: string[]) => void;
}

export const useExtractionStore = create<ExtractionState>((set) => ({
  statusByNodeId: {},
  errorByNodeId: {},
  extractedFromDb: {},
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
  clearAll: () =>
    set({ statusByNodeId: {}, errorByNodeId: {}, extractedFromDb: {} }),
  hydrateExtractedFromDb: (nodeIds) =>
    set((state) => {
      const next = { ...state.extractedFromDb };
      for (const id of nodeIds) next[id] = true;
      return { extractedFromDb: next };
    }),
  hydrateFromNodeText: (nodeIds) =>
    set((state) => {
      const next = { ...state.statusByNodeId };
      for (const id of nodeIds) next[id] = "done";
      return { statusByNodeId: next };
    }),
}));
