# Environment

Career Studio runs without private credentials in local preview mode. Optional integrations unlock specific import flows.

## Local Preview

```bash
npm install
npm run dev
```

The dev server runs on port `3030` and stores workspace state in browser storage under `career-studio:workspace:v1`.

## Optional Variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY` | public browser config | Firebase identity, if enabled |
| `VITE_FIREBASE_AUTH_DOMAIN` | public browser config | Firebase identity domain |
| `VITE_FIREBASE_PROJECT_ID` | public browser config | Firebase project |
| `VITE_FIREBASE_DATABASE_ID` | public browser config | Firestore database ID; use `career-studio` |
| `VITE_FIREBASE_STORAGE_BUCKET` | public browser config | Firebase storage config value |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | public browser config | Firebase app config |
| `VITE_FIREBASE_APP_ID` | public browser config | Firebase app config |
| `VITE_FIREBASE_MEASUREMENT_ID` | public browser config | Optional Firebase Analytics app config |
| `VITE_FIREBASE_USE_EMULATORS` | public browser config | Set to `true` only when using local Firebase emulators |
| `TABSTACK_API_KEY` | server only | Public job-posting extraction |
| `VITE_TABSTACK_API_KEY` | legacy fallback | Prefer `TABSTACK_API_KEY` for server-only use |
| `VITE_GEMINI_API_KEY` | server runtime config | Optional resume import assist |
| `VITE_GOALMATIC_APP_URL` | public browser config | Goalmatic link target |
| `VITE_APP_MODE` | public browser config | `local`, `self-hosted`, or production deployment label |

Never commit `.env*` files, service-account credentials, API keys, or tokens.

When Firebase is configured, Career Studio uses the same Firebase project values
as Goalmatic and binds Firestore to the named `career-studio` database rather
than `(default)`. Storage and Functions use the same Firebase app instance.

## Health Check

`GET /api/health` returns service status, app mode, version, and booleans for optional integration configuration. It does not return user IDs, resume text, API keys, or other secrets.
