# ENV.md

## Required Environment Variables

| Variable | Description | Source | Default (Local) |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base URL for the Backend API | `.env.local` / Vercel | `http://localhost:3001` |

## Environment Context

### Development
-   **File**: `.env.local`
-   **Behavior**: Connects to locally running API (usually port 3001).

### Production
-   **File**: Vercel Environment Variables
-   **Behavior**: Connects to the deployed production API URL.

## Prohibitions
-   **NO SECRETS**: Never store private keys, DB passwords, or service tokens in frontend environment variables.
-   **Default Values**: Do not hardcode failovers in code (e.g., `process.env.API || 'http://localhost'`). Fail if env var is missing.
