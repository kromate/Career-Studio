# Contributing to Career Studio

Thanks for contributing.

## Development

Use Node.js 22 or newer and npm. The local preview does not require private
Goalmatic repositories or credentials.

```bash
npm install
npm run dev
```

Before opening a pull request, run:

```bash
npm test
npm run typecheck
npm run build
npm audit
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
