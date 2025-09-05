## Goal

Persist canvas graph (nodes, edges, relationships) and associated media (image/video/audio/pdf) in IndexedDB so state survives reloads and sessions.

## Tasks

1. Design IndexedDB schema for nodes, edges, and media stores

- Define DB name/version, object stores, keys, and indexes.
- Stores:
  - `nodes` (key: `id`)
  - `edges` (key: `id`, indexes: `source`, `target`)
  - `media` (key: `id`, Blob + mime + size)
  - `meta` (key: `k`, value: version/lastSaved)
- Relationship: nodes may reference media by `mediaIds` inside node `data` where applicable.
- Acceptance: Upgrade path from current `images` store defined; new DB opens cleanly.

2. Build typed IndexedDB helper (open/upgrade, CRUD, bulk ops, transactions)

- Provide `openDb(version)`, `tx(storeNames, mode)`, `get`, `put`, `add`, `delete`, `getAll`, `getAllFromIndex`, `bulkPut`, `bulkDelete`.
- Wrap in Promise API; ensure errors are surfaced.
- Acceptance: Unit usage examples work; errors logged; transactions close.

3. Implement node/media serialization/deserialization utilities

- Define canonical on-disk types to avoid storing non-serializable `File` objects.
- Store media as Blob in `media` store; nodes contain `mediaId` and `preview` base64 when needed.
- Provide `serializeNode(node)` and `deserializeNode(raw)` that map to `CustomNode`.
- Acceptance: Round-trip of all node types works (Text/WebPage/Image/Video/Audio/PDF).

4. Wire Zustand store to load from DB on init and save on updates

- On app start: load `nodes` + `edges` from DB into `useCanvasStore`.
- Replace in-memory `initialNodes/initialEdges` defaults after first successful load; seed only if DB is empty.
- Save nodes/edges on any `setNodes`/`setEdges` mutation.
- Acceptance: Reload preserves graph; cold start seeds once.

5. Persist ReactFlow changes (debounced node/edge writes)

- Hook `onNodesChange`, `onEdgesChange`, `onConnect` to persist debounced (e.g., 300–500ms).
- Ensure drag/move produces minimal write amplification.
- Acceptance: Moving nodes rapidly does not freeze UI, final positions persist.

6. Handle media paste/import: save Blob to media store, store mediaId in node

- On paste/import, write Blob to `media` store with generated `id` and `mime`.
- Node `data` stores `mediaId` and optionally small `previewBase64` for thumbnails.
- Revoke any object URLs after use; reconstruct on load with `URL.createObjectURL(Blob)`.
- Acceptance: Media nodes rehydrate with working previews/players after reload.

7. Update duplicate/delete flows to persist nodes/edges and GC media refs

- Update duplicate to persist cloned node and edges.
- On delete, remove node and incident edges; if no remaining node references a `mediaId`, delete that media Blob.
- Acceptance: Duplicates persist; deletes remove unreachable media.

8. Add migration from existing v1 `images` store to new schema

- On upgrade: read `images` entries, convert to `media` store entries, update any nodes if present.
- Keep idempotent; mark `meta.version`.
- Acceptance: Users with prior data see it migrated with no loss.

9. Add size limits, error handling, and user toasts for persistence ops

- Limit single Blob size (e.g., 200MB) and total quota checks; show helpful toasts.
- Gracefully handle quota exceeded, blocked upgrade, and unavailable IDB.
- Acceptance: Errors are surfaced; app stays responsive.

10. Manual QA: add nodes/edges/media, reload verification, edge cases

- Scenarios: paste multiple media types; connect edges; drag/move; duplicate; delete; reload.
- Edge cases: very large files; repeated upgrades; browser without IDB; incognito.
- Acceptance: All scenarios persist and rehydrate correctly.

## Implementation Notes

- Do not store `File` in nodes; store Blob in `media` and reference by `mediaId`.
- Keep `CustomNode.data` minimal and serializable; derive ephemeral fields (blob URLs) at runtime.
- Use a single write queue with debounce to serialize DB writes.
- For future: add `projects`/`workspaces` store to segment graphs.

## Acceptance Criteria (Summary)

- Graph and media persist across reloads consistently.
- Media blobs are deduplicated and garbage collected when unreferenced.
- No UI jank during drag/move; writes are debounced.
- Migration from existing schema completes without data loss.
