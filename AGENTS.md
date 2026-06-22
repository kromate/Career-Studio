# Career Studio Agent Notes

- This is an independent Goalmatic App repository.
- Run Git and project commands from this repository.
- Keep the app independently buildable, testable, and deployable.
- Goalmatic provides identity, account context, Tables data, agents, workflows,
  integrations, and AI automation. Keep app-specific UI and orchestration here.
- Numeric resume and job-match scores must come only from the versioned,
  deterministic scoring engine described in `docs/SCORING.md`. Never ask an
  LLM to choose or adjust a score.
- AI rewrite features must preserve user evidence and require approval before
  adding potentially new facts to an exportable resume.
- Do not describe the score as a universal score assigned by all ATS products.
- Use stable Goalmatic APIs or SDKs; do not import private files from `gm/`.
- Enforce real user/account/org isolation. Never use `default` as a production
  identity.
- Prefer existing Goalmatic connected accounts and OAuth over raw API keys.
- Keep `.env*`, service accounts, API tokens, and runtime config secret.
- Update `goalmatic/app.json` and `docs/ARCHITECTURE.md` when platform
  dependencies change.
- The app is Nuxt 3 with Vue and TypeScript. Run `npm install` once, then use
  `npm run dev` on port `3030`, `npm test`, `npm run typecheck`, and
  `npm run build`.
- Local preview state is stored under `career-studio:workspace:v1` in browser
  storage. Production persistence must use account-scoped Goalmatic adapters.
- PDF, DOCX, and TXT extraction runs in the browser in local preview mode.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
