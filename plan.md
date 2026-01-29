## Vision

Build a **front‑end–only canvas app + PWA** that:

- **Stores all graph data locally** in **SQLite (WASM)**.
- **Runs a local LLM in the browser** (WebGPU‑first, WASM fallback) for:
  - Interpreting natural‑language (NL) queries into structured queries over SQLite.
  - Summarizing / explaining query results and selected graph regions.
- **Extracts text from images and PDFs client‑side** (OCR + PDF parsing) so those nodes become first‑class searchable/queriable entities.
- Supports **user‑selectable query scope**: **tab‑specific** vs **global** (all tabs).

The **graph UI remains primary**; the LLM and query system operate over the underlying tables and drive how the graph is filtered, highlighted, and summarized.

---

## High‑Level Architecture

- **Frontend app**
  - Framework: existing React + Vite + Zustand + ReactFlow.
  - Form factor: SPA, installable as **PWA**.
- **Local data layer**
  - **SQLite (WASM)** for:
    - Tables: `tabs`, `nodes`, `edges`, `media`, `entities`, `tags`, etc.
    - Persisted in browser storage (e.g. OPFS / IndexedDB backend from the SQLite WASM runtime).
  - IndexedDB used only as **implementation detail** if the chosen SQLite runtime needs it.
- **Search & indexing layer**
  - Logical responsibilities:
    - **Structured index** over SQLite tables (SQL queries).
    - **Full‑text search** (FTS in SQLite or separate text index).
    - Optional **vector index** for semantic search (stored in SQLite tables).
- **LLM layer (local only)**
  - **Runtime choice**: WebGPU‑first runtime such as **WebLLM** or `transformers.js` (final pick in implementation phase).
  - **Model**: small, instruction‑tuned model (~1–3B params) optimized for:
    - NL → structured query spec.
    - Answering questions given a bounded context.
  - Responsibilities:
    - `interpretQuery(nlQuery, scope) -> StructuredQuerySpec`.
    - `answerWithContext(question, context) -> Answer + citations`.
- **Media processing layer**
  - **OCR**:
    - Use a client‑side OCR library (e.g. **Tesseract.js**) for images.
  - **PDF text extraction**:
    - Use a browser PDF library (e.g. **pdf.js** or a lightweight alternative) to extract text, titles, and metadata.
  - Produces:
    - Extracted **plain text**.
    - Basic **metadata** (page count, headings if available).
  - Feeds into SQLite tables and text/vector indices.

---

## Data Model (First‑Class Entity + Relation)

### 1. Core tables

- **`tabs`**
  - **Fields**: `id`, `title`, `iconKey`, `createdAt`, `updatedAt`.
  - **Purpose**: logical canvases / workspaces. Used for **query scoping**.

- **`nodes`**
  - **Fields**:
    - `id` (PK)
    - `tabId` (FK → `tabs.id`, allows tab‑scoped queries)
    - `type` (`note`, `todo`, `pdf`, `image`, `video`, `audio`, `link`, etc.)
    - `x`, `y` (position on canvas)
    - `dataJson` (JSON blob for node‑specific data)
    - `createdAt`, `updatedAt`
  - **Purpose**: unified node table for all visual elements on the graph.

- **`edges`**
  - **Fields**:
    - `id` (PK)
    - `tabId` (FK → `tabs.id`)
    - `sourceNodeId`, `targetNodeId`
    - `type` (optional edge types later)
    - `createdAt`
  - **Purpose**: relationships between nodes for both visualization and semantics.

- **`node_text`**
  - **Fields**:
    - `nodeId` (PK, FK → `nodes.id`)
    - `plainText` (full text for search/RAG)
    - Optional: `summary`, `title`, `language`
  - **Purpose**: normalized textual content used by full‑text and vector search.

- **`tags` / `node_tags`**
  - **`tags`**: `id`, `label`, `createdAt`
  - **`node_tags`**: `nodeId`, `tagId`
  - **Purpose**: structured tags for better filtering and LLM‑friendly metadata.

- **`media`**
  - **Fields**:
    - `id`
    - `nodeId` (FK → `nodes.id`)
    - `mimeType`
    - `fileName`
    - `size`
    - `createdAt`
    - `storageKey` (link to blob location in browser storage / OPFS / IndexedDB)
  - **Purpose**: metadata for images, PDFs, audio, video.

### 2. Node‑type schemas (in TS)

Represented as TypeScript interfaces and stored in `dataJson`:

- **NoteNodeData**: `title`, `content`, `tags`, `createdAt`, `updatedAt`, `linkedTo[]`.
- **TODONodeData**: `title`, `description`, `status`, `priority`, `dueDate`, `tags`, `assignedTo`.
- **PDFNodeData**: `title`, `pageCount`, `extractedTextId` (link to `node_text`), etc.
- **ImageNodeData**: `title`, `altText`, `ocrTextId` (link to `node_text`), etc.

This lets the LLM see consistent structured fields even though the graph UI is freeform.

---

## Query Model & LLM Integration

### 1. StructuredQuerySpec

Define a small, explicit “query language” that the LLM produces and the app executes.

- **Shape (example)**:

```ts
type Scope = { type: "tab"; tabId: string } | { type: "global" };

type NodeType = "note" | "todo" | "pdf" | "image" | "audio" | "video" | "link";

interface StructuredQuerySpec {
  scope: Scope;
  nodeTypes?: NodeType[];
  mustHaveTags?: string[];
  mustNotHaveTags?: string[];
  textSearch?: {
    query: string;
    mode: "full-text" | "fuzzy";
  };
  dateFilters?: {
    field: "createdAt" | "updatedAt" | "dueDate";
    op: "before" | "after" | "between";
    value: number | { from: number; to: number };
  }[];
  statusFilter?: {
    field: "status";
    values: string[];
  };
  limit?: number;
  sort?: {
    field: "createdAt" | "updatedAt" | "dueDate";
    direction: "asc" | "desc";
  };
}
```

- **Flow**:
  1. User enters NL query + selects scope (tab/global).
  2. App sends NL + scope to local LLM.
  3. LLM returns `StructuredQuerySpec` as JSON (validated in app).
  4. App executes the spec against SQLite and obtains a set of `nodeIds` + metadata.
  5. Graph UI highlights / focuses these nodes; optional answer text is generated using `node_text` contents.

### 2. LLM responsibilities

- **Primary**:
  - NL → `StructuredQuerySpec`.
  - Summarize results: “You have 5 TODOs due this week in tab ‘Research’.”
- **Secondary** (later):
  - Suggest tags / fields for new content.
  - Summarize selected subgraphs.

### 3. LLM runtime & model

- **Runtime**:
  - WebGPU‑first LLM runtime (e.g. **WebLLM** or `transformers.js` with WebGPU backend).
  - WASM/CPU fallback if WebGPU unavailable.
- **Model**:
  - Small instruction‑tuned, open‑weight model (~1–3B parameters).
  - Optimized for:
    - Following JSON output formats.
    - Reasoning over short contexts.
  - Model is:
    - Downloaded on demand after user opt‑in (cache in browser).
    - Versioned so we can change it later without breaking the app.

---

## Media Processing (Images & PDFs)

### 1. Image OCR

- **Library**: use **Tesseract.js** for client‑side OCR.
- **Flow**:
  1. User drops/pastes/uploads an image.
  2. We create an `ImageNode` + `media` row and store the blob via existing blobManager.
  3. In background:
     - Tesseract.js processes the image.
     - Extracted text is normalized.
     - A `node_text` row is created with `plainText` = OCR output (linked via `nodeId`).
  4. Search/index layer updates full‑text and vector indices with this text.
  5. The node is automatically tagged with:
     - `ocr` / `image-text` tag.
     - Any auto‑detected keywords if desired later.

### 2. PDF text extraction

- **Library**: use **pdf.js** (or a small wrapper) in the browser.
- **Flow**:
  1. User uploads a PDF → create `PDFNode` + `media` row.
  2. In background:
     - Use pdf.js to read each page’s text.
     - Concatenate and optionally chunk text for better indexing.
     - Create `node_text` rows (single row for now; can split by sections later).
  3. Update full‑text and vector indices.
  4. Tag node with `pdf` / `document` and potential auto‑labels (e.g. from title or headings).

### 3. Performance & UX considerations

- Run OCR/PDF processing in **Web Workers** to avoid blocking the UI.
- Indicate processing state on the node (e.g. small spinner/badge “Extracting text…”).
- Allow the user to re‑run extraction or clear OCR text if needed later.

---

## Phased Implementation Plan

### Phase 1 – Introduce SQLite (WASM) as primary data store

- **Goals**:
  - [x] Add SQLite WASM runtime.
  - [x] Mirror or migrate existing graph data into SQLite tables.
  - [x] Keep app behavior unchanged from user’s perspective.

- **Tasks**:
  - [x] **Choose SQLite WASM binding**:
    - Evaluate options (e.g. `sql.js`, `wa-sqlite`, `sqlite-wasm` from official SQLite, etc.).
    - Pick one with:
      - Good TypeScript support.
      - OPFS/IndexedDB persistence.
  - [x] **Create SQLite initialization module**:
    - Open/create DB.
    - Run migrations to create tables: `tabs`, `nodes`, `edges`, `media`, `node_text`, `tags`, `node_tags`.
    - Provide a `db` abstraction with typed methods.
  - [x] **Bridge from Zustand store to SQLite**:
    - When nodes/edges/tabs change:
      - Persist to SQLite instead of (or in addition to) IndexedDB.
    - On app start:
      - Load graph state from SQLite and hydrate Zustand.
  - [x] **Migrations / coexistence strategy** (short‑term):
    - Option A: temporarily keep IndexedDB as backup; on first run, migrate to SQLite and mark a flag.
    - Option B: treat SQLite as source of truth immediately and use IDB only via SQLite internals.
  - [x] **Testing**:
    - Create/edit/delete nodes, edges, tabs; reload app; verify state matches.
    - Confirm multiple tabs and large canvases behave correctly.

### Phase 2 – Basic query service over SQLite

**Goals:**

- [x] Implement a **non‑LLM** `QueryService` to exercise SQLite schemas
- [x] Support user‑selectable **tab vs global** scope

**Tasks:**

- [x] Implement `StructuredQuerySpec` (TS types) as above
- [x] Implement `QueryService` that:
  - [x] Accepts `StructuredQuerySpec`
  - [x] Builds parameterized SQL against SQLite tables
  - [x] Returns `nodeIds` and minimal metadata (type, title, createdAt, tags)
- [x] Add a temporary dev UI:
  - [x] Textarea for JSON `StructuredQuerySpec`
  - [x] Button to execute
  - [x] Console/log & simple list for results
- [x] Implement scope handling:
  - [x] `scope.type === "tab"` → add `WHERE tabId = ?`
  - [x] `scope.type === "global"` → no tab filter
- [x] Validate:
  - [x] Queries for specific types (TODOs, PDFs)
  - [x] Tag‑based filtering
  - [x] Date filtering

### Phase 3 – Local LLM integration (NL → StructuredQuerySpec)

**Goals:**

- [ ] Integrate local LLM runtime and chosen model
- [ ] Enable **NL queries** translated into `StructuredQuerySpec`

**Tasks:**

- [ ] LLM runtime integration:
  - [ ] Add WebGPU‑first backend (e.g. WebLLM / `transformers.js`)
  - [ ] Implement feature detection for WebGPU and WASM fallback
  - [ ] Build model loader with progress UI placeholder and basic caching between sessions
- [ ] `llmService` abstraction:
  - [ ] `interpretQuery(nl: string, scope: Scope): Promise<StructuredQuerySpec | Error>`
  - [ ] Ensure strict JSON output (system/prompt messages telling model to return only JSON matching schema)
  - [ ] Validate on the client and surface errors clearly
- [ ] Glue to `QueryService`:
  - [ ] For a dev UI: text input for NL query
  - [ ] Scope toggle (tab/global)
  - [ ] On submit: call `interpretQuery`, if valid call `QueryService.execute`, log structured spec, SQL, and results
- [ ] Initial prompts & iteration:
  - [ ] Design prompts to map simple English requests to field filters
  - [ ] Respect scope consistently
  - [ ] Avoid generating unsupported fields

### Phase 4 – Media text extraction (OCR + PDFs) into `node_text`

**Goals:**

- [ ] Automatically extract and store text for images and PDFs
- [ ] Make these texts queryable via both structured and text search

**Tasks:**

- [ ] Integrate Tesseract.js for images:
  - [ ] Add a worker‑based OCR pipeline (receives image blob or URL, produces text)
  - [ ] Extend image upload/paste flow: after creating `ImageNode` and `media` row, kick off OCR
  - [ ] On completion, create/update `node_text` record
- [ ] Integrate pdf.js for PDFs:
  - [ ] On PDF upload, parse and extract text per page
  - [ ] Concatenate and store in `node_text.plainText`
- [ ] Indexing:
  - [ ] Ensure `node_text.plainText` is included in full‑text search
  - [ ] Make it available to the LLM as context for answers
- [ ] UX (minimal for now):
  - [ ] Show a small state indicator on nodes being processed
  - [ ] Allow user to see extracted text in a dev/debug panel

### Phase 5 – LLM answering with context (global queries)

**Goals:**

- [ ] Support **global and tab‑scoped NL queries** end‑to‑end:
  - [ ] Interpret NL → StructuredQuerySpec
  - [ ] Execute spec over SQLite
  - [ ] Retrieve `node_text` for matches
  - [ ] Ask LLM to answer with citations

**Tasks:**

- [ ] Extend `llmService` with:

```ts
askWithContext(
  question: string,
  nodes: {
    id: string;
    type: string;
    title?: string;
    plainText: string;
    tags: string[];
  }[]
): Promise<{ answer: string; usedNodeIds: string[] }>;
```

- [ ] Implement RAG‑like flow:
  - [ ] Use `StructuredQuerySpec` + `QueryService` to narrow down candidate nodes
  - [ ] Optionally rank/limit nodes (e.g. top 20 by recency / text match)
  - [ ] Construct a prompt that embeds snippets of `plainText` with node IDs
  - [ ] Ask the model to answer and refer to node IDs
- [ ] For now, return answer + node IDs; UI can still be dev‑style (console/log overlay)

### Phase 6 – UX integration (beyond initial request, optional next steps)

**Goals:**

- [ ] Tie the above capabilities into the graph UI with a polished experience

**Ideas (to be detailed later):**

- [ ] Global query input (top bar / command palette)
- [ ] Scope toggle (tab/global) near the query input
- [ ] Query results overlay:
  - [ ] Highlight matching nodes
  - [ ] Allow quickly jumping between them
- [ ] Answer panel:
  - [ ] Show LLM answer with inline links to nodes

---

## Non‑Goals (for now)

- Multi‑user collaboration and server‑side sync.
- Cloud‑hosted LLMs (we’re local‑only to start).
- Advanced vector databases; we may simulate vector search via SQLite tables if/when needed.

---

## Success Criteria for Initial Milestones

- **After Phase 1**:
  - App loads all nodes/edges/tabs from SQLite.
  - Canvas behavior is unchanged for the user.

- **After Phase 3**:
  - You can type: “show open todos due this week in this tab” and:
    - Local LLM produces a valid `StructuredQuerySpec`.
    - Query executes over SQLite and returns sensible nodes.

- **After Phase 4**:
  - Uploading an image/PDF leads to:
    - OCR/text extraction.
    - That text being searchable/queryable via specs.

- **After Phase 5**:
  - You can issue a **global or tab‑scoped** NL query and:
    - Get a coherent answer from the local LLM.
    - See which nodes were used (via IDs/logging, or basic UI).
