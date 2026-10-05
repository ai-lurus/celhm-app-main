# TODO

## Commissions UX fixes (found during UX review, 2026-09-21)

Reviewed `/dashboard/commissions` logged in as `admon@acme-repair.com` (Acme Repair org, seeded via `celhm-api-main/prisma/seed.ts`, password `ChangeMe123!`).

- [x] **Modals can't be dismissed via Escape or backdrop click.**
  Fixed via a shared `src/components/ui/Modal.tsx` (Escape handler, backdrop
  click-to-close, `role="dialog"`/`aria-modal`/`aria-labelledby`, modeled on
  `ConfirmDialog.tsx`'s existing Escape handling). `PlanFormModal.tsx` and
  `RuleFormModal.tsx` now render through it.

- [x] **Sidebar never collapses on mobile — commissions UI unusable under ~768px.**
  `Sidebar.tsx` is now a slide-in drawer under the `md` breakpoint
  (`-translate-x-full` / `translate-x-0`, closes on route change, backdrop
  click, or its own close button); `dashboard/layout.tsx` adds a mobile-only
  header with a hamburger trigger. Desktop (`md:` and up) is unchanged —
  static, always visible.

- [x] **Minor: bare empty/loading states.** Added `LoadingState`/`EmptyState`
  components (spinner + icon) in `commissions/_components/`, used across
  `PlanList.tsx`, `OverridesPanel.tsx`, and `page.tsx` wherever a "Cargando..."
  or "No hay/No se encontraron..." text row existed.

- [x] **Minor: "Tasa actual: –" has no explanation.** Already resolved on this
  branch by `6aedd3d` (`EffectiveRuleSummary`, three explicit states incl.
  "Sin regla: no genera comisiones") — verified in the running app, no further
  change needed.

### Verification
Modal Escape/backdrop-close and the new empty/loading states were tested live
against this branch's dev server (`/dashboard/commissions`, both tabs) via
Chrome. The mobile sidebar drawer was verified by reading the rendered
Tailwind classes (`md:hidden` header, `-translate-x-full`/`md:translate-x-0`
on the sidebar) — the actual browser window could not be resized below
desktop width in this environment, so a manual check on a real narrow
viewport (or Chrome's device toolbar) is still worth doing before this ships.
`tsc --noEmit` is clean on all touched files.
