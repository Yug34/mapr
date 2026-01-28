# Tech / architecture enhancements

## First‑class “entity + relation” model

- Even if stored as notes, define a clear domain model:
  - entities (note, person, project, task, event, etc.)
  - relations (linked_to, belongs_to, attended, authored).

- This makes:
  - SQL queries easier (if you go SQLite),
  - RAG richer (LLM sees structured metadata),
  - Future visualizations and automations easier.

## RAG pipeline as a separate layer

- Treat retrieval as a service with clear steps:
  - Parse NL query → filters/intent.
  - Run symbolic query (SQL or indexed search) to narrow candidates.
  - Run vector similarity on chunks of those candidates.
  - Compose a context bundle → send to LLM.

- Keeping this as a distinct module lets you swap models, stores, or ranking strategies later.

## Dual index: text + structure

- Full‑text search over note content + titles.
- Structured index over fields (tags, dates, types, relations).
- For queries, always:
  - Use structure first (fast, precise),
  - Then use embedding search as a complement, not the only mechanism.

## Clear separation of concerns in the frontend

- Data layer: client‑side repo that abstracts over SQLite/IndexedDB/LLM services.
- View layer: React/Vue/Svelte components that are mostly dumb, driven by observable/query hooks.
- AI orchestration layer:
  - Small set of high‑level functions (askAboutSelection, suggestFields, summarizeView) that UI calls.
  - Keeps prompts and model plumbing out of random components.

## Predictable offline behavior

- Decide: what must work offline (view/edit notes, run local LLM, queries over local DB).
- Make all those flows explicitly offline‑safe and visually indicate when remote features (sync, cloud LLM) are unavailable.

## Instrumentation for learning

- Log (locally, anonymized or opt‑in) which:
  - Queries users run,
  - Views are most used,
  - AI answers get “useful / not useful”.
- Use this to tune:
  - Default views,
  - RAG strategy,
  - Which templates/fields matter.
