# Self-Hosting

Career Studio can be self-hosted as a Nuxt app. The current open-source mode uses browser storage for workspace data unless a production adapter is added.

## Modes

| Mode | Storage | Notes |
| --- | --- | --- |
| Local preview | Browser local storage | Best for contributors and demos. |
| Standalone self-hosted | Browser local storage | Deployable with Docker; users control their own browser data export/import. |
| Goalmatic production | Goalmatic account-scoped adapters | Requires production storage, private objects, retention, and auth isolation. |

## Docker

```bash
docker compose up --build
```

The app listens on `http://localhost:3030` and exposes `GET /api/health`.

## Production Checklist

- Use real authenticated `user_id` and `account_id`; never use `default` identities.
- Store uploaded source files in private object storage, not public web roots.
- Store provider keys server-side only, encrypted at rest, and redact them from logs.
- Keep resume text out of analytics, logs, error payloads, and health responses.
- Recheck authorization on signed export URLs and keep them short-lived.
- Support data export and deletion for resumes, versions, analyses, jobs, applications, cover letters, and exports.
- Run `npm run quality` before release.
