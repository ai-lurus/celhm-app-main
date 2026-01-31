# ARCHITECTURE.md

## System Structure
Monorepo application built with Next.js App Router.

### Core Components
- **`src/app`**: Route definitions, layouts, and pages. Follows Next.js 14+ App Directory structure.
- **`src/components`**: Feature-specific UI components.
- **`src/lib`**: Utilities, hooks, and API clients configuration (Axios).
- **`src/stores`**: Global client-state managed by Zustand.
- **`src/actions`**: Server actions (if strictly necessary, prefer API routes usually).
- **`packages/ui`**: Shared, reusable, presentational components (buttons, inputs, dialogs).
- **`packages/types`**: Shared TypeScript definitions used by both frontend and potential other packages.
- **`packages/config`**: Shared configuration for ESLint, TS, and Prettier.

## Responsibility Boundaries
- **Pages (`page.tsx`)**: Data fetching initiation (prefetching), layout composition.
- **Components**: Logic for UI interaction, rendering data.
- **Zustand Stores**: Global UI state (modals, theme, user session).
- **React Query**: Server state caching, loading/error states.
- **API (backend)**: Business logic, database interaction. Frontend treats backend as opaque JSON API.

## Data Flow
1.  **User Action**: User interacts with UI (Component).
2.  **State Change**: Component calls generic Hook or Zustand Store.
3.  **Network Request**: React Query triggers Axios request to `NEXT_PUBLIC_API_URL`.
4.  **Response**: Data returned, validated (Zod recommended), and cached by React Query.
5.  **Render**: Components re-render with fresh data.

## Structural Decisions
- **Monorepo**: Logic separated into `types` and `ui` packages to enforce separation of concerns and reusability.
- **Tailwind**: Utility-first CSS for consistency and performance.
- **Radix UI**: Headless UI primitives for accessible components within `packages/ui`.
- **Axios**: HTTP client preferred over `fetch` for interceptors (auth token handling).
