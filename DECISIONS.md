# DECISIONS.md

## Stack Decisions

### Framework: Next.js App Router
-   **Status**: Accepted
-   **Date**: Unknown (Inferred from codebase)
-   **Tradeoffs**: Higher complexity than Pages router, but better performance and features (Server Components).
-   **Rejected**: pure React SPA (CRA/Vite) for better SEO and initial load.

### Styling: Tailwind CSS
-   **Status**: Accepted
-   **Date**: Unknown
-   **Tradeoffs**: Class clutter in HTML vs. rapid development and smaller CSS bundle.
-   **Rejected**: CSS Modules, Styled Components.

### State Management: Zustand + React Query
-   **Status**: Accepted
-   **Date**: Unknown
-   **Tradeoffs**: Separation of server state (Query) and client state (Zustand). Increases dependency count but clarifies data ownership.
-   **Rejected**: Redux (too boilerplate), Context API (performance issues for high-frequency updates).

### Monorepo Structure (pnpm workspaces)
-   **Status**: Accepted
-   **Date**: Unknown
-   **Tradeoffs**: Complex tooling setup vs. improved code sharing (UI/Types) and dependency management.

### Component Library: Radix UI
-   **Status**: Accepted
-   **Date**: Unknown
-   **Tradeoffs**: Unstyled primitives require styling work (handled in `packages/ui`) vs. full control and accessibility.
-   **Rejected**: Material UI, AntD (too opinionated/bloated).

## Implicit Decisions
-   **Authentication**: JWT handled via Authorization header (implied by typical pattern with NestJS backend).
-   **Forms**: React Hook Form using standard uncontrolled inputs for performance.
