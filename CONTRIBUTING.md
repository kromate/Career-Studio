# Contributing to Career Studio

Thanks for contributing. To ensure a high-quality codebase, we follow a set of development rules and standards.

## Code Standards & Rules

- **Package Manager**: Strictly use **Yarn** (`yarn install`, `yarn add`, etc.). Do not use `npm` or `pnpm`.
- **Framework & Logic**: Use Vue 3 `<script setup>` with TypeScript for all components.
- **Styling**: Use standard CSS with scoped styles or standard classes. Avoid arbitrary inline styles.
- **Linting & Formatting**: Ensure there are no ESLint or Prettier warnings before committing. Run `yarn lint`.
- **Commits**: Follow Conventional Commits format (e.g., `feat:`, `fix:`, `chore:`, `docs:`).

## Development

Use Node.js 22 or newer and Yarn. The local preview does not require private
Goalmatic repositories or credentials.

```bash
yarn install
yarn dev
```

Before opening a pull request, run:

```bash
yarn test
yarn typecheck
yarn build
yarn lint
```

Resume scores must remain deterministic. Add or update repeatability tests for
every scoring-rule change, and increment the relevant version constant when a
change can affect stored results.

## Pull Requests

- Keep changes focused and include tests appropriate to the behavior.
- Update the architecture and Goalmatic resource manifest when dependencies
  change.
- Never commit credentials, customer data, or production exports.
- Explain new permissions, integrations, tables, agents, and workflows.
- Use synthetic resume and job fixtures in tests and screenshots.

## Security

Do not open a public issue for a vulnerability or exposed credential. Add the
project's private security contact here before publishing the repository.
