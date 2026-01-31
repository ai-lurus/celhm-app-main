# CLAUDE.md

## Role
Frontend Web Application for CelHM (Cellular Repair Shop Management System).

## Stack
- **Framework**: Next.js 15.5.7 (App Router)
- **Language**: TypeScript 5.3+
- **Styling**: Tailwind CSS 3.3.6, Radix UI, lucide-react
- **State**: Zustand 4.4.7
- **Data Fetching**: TanStack Query 5.8.4, Axios
- **Testing**: Jest (Unit), Playwright (E2E)
- **Package Manager**: pnpm 8.15.1
- **Monorepo**: pnpm workspaces (`packages/types`, `packages/ui`, `packages/config`)

## Commands
- **Dev Server**: `pnpm dev` (Runs on http://localhost:3000)
- **Build**: `pnpm build`
- **Start**: `pnpm start`
- **Test (Unit)**: `pnpm test`
- **Test (E2E)**: `pnpm test:e2e`
- **Test (E2E UI)**: `pnpm test:e2e:ui`
- **Lint**: `pnpm lint`
- **Typecheck**: `pnpm typecheck`
- **Format**: `pnpm format`

## Rules
- **No Class Components**: Use React Functional Components and Hooks.
- **Strict Types**: No `any`. Use shared types from `@celhm/types` when possible.
- **Styling**: Use Tailwind utility classes. Avoid inline styles.
- **State Management**: Use Zustand for global state, React Query for server state.
- **Components**: Place reusable UI in `packages/ui`. Feature-specific components go in `src/components`.
- **Routing**: Use Next.js App Router conventions (`layout.tsx`, `page.tsx`).
- **Imports**: Use absolute imports (`@/components`, `@/lib`) or monorepo aliases (`@celhm/ui`).
- **Forms**: Use `react-hook-form` + `zod`.

## Prohibitions
- Do not use `useEffect` for data fetching (use React Query).
- Do not modify `packages/config` unless strictly necessary for global tooling updates.
- Do not use `console.log` in production code.
