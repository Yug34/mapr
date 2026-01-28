# UX / UI ideas

## Make the “queryable database” visible

- Structured views: not just notes, but table/board/timeline views over your data (tasks, projects, people, meetings).
- Facet filters: side panel with filters (tags, date ranges, types) that update the result list instantly.
- Inline schema hints: when editing a note, show which “fields” you’re filling (#project, @person, due:, etc.), so users see how their input powers queries.

## Tight integration between UI actions and LLM

- Contextual ask: right‑click or shortcut “Ask about this note/selection” that opens a side panel with an answer pinned to that context.
- Explain queries: when the user runs a natural‑language query, show “LLM translated this to: [human‑readable filter/SQL summary]” so it doesn’t feel like a black box.
- Saved AI queries as views: let people pin a query (“show all open research tasks this week”) as a persistent sidebar item or tab.

## Graph + narrative

- Graph view: nodes for notes/entities, edges for links/relations, with the ability to:
- Lasso‑select a subgraph and “Ask LLM about this selection”.
- Story mode: LLM can “walk the graph” and generate a narrative; UI shows which nodes it used and lets users jump into them.

## Trust and control

- Source citations: every AI answer includes direct links to specific notes/records it used.
- One‑click refine: chips like “narrow to last 7 days”, “only tasks”, “exclude personal” that append to the current query.
- Clear offline/local indicators: badge that shows “Model running locally” vs “Using cloud model”, with data‑sharing explanation.

## Onboarding and progressive disclosure

- Start simple (notes + a “search with AI” bar).

- Gradually introduce:
  - Structured fields/templates,
  - Saved queries,
  - Advanced views.

- Use guided tours for “Turn this notebook into a database”, “Build your first queryable template”, etc.
