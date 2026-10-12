import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export interface TabRegistryEntry {
  path: string;
  label: string;
  Component: ComponentType;
}

// Each entry dynamically imports the EXACT same component Next.js uses as that
// route's page (app/dashboard/.../page.tsx). We render it ourselves inside the
// tab shell instead of relying on Next's `children`, so it can stay mounted
// alongside other open tabs. The underlying page files are untouched.
export const tabRegistry: TabRegistryEntry[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    Component: dynamic(() => import("../app/dashboard/page"), { ssr: false }),
  },
  {
    path: "/dashboard/laboratorio",
    label: "Laboratorio",
    Component: dynamic(() => import("../app/dashboard/laboratorio/page"), { ssr: false }),
  },
  {
    path: "/dashboard/customers/groups",
    label: "Grupos de Clientes",
    Component: dynamic(() => import("../app/dashboard/customers/groups/page"), { ssr: false }),
  },
  {
    path: "/dashboard/customers",
    label: "Clientes",
    Component: dynamic(() => import("../app/dashboard/customers/page"), { ssr: false }),
  },
  {
    path: "/dashboard/sales",
    label: "Ventas",
    Component: dynamic(() => import("../app/dashboard/sales/page"), { ssr: false }),
  },
  {
    path: "/dashboard/inventory/categories",
    label: "Categorías",
    Component: dynamic(() => import("../app/dashboard/inventory/categories/page"), { ssr: false }),
  },
  {
    path: "/dashboard/inventory/brands",
    label: "Marcas",
    Component: dynamic(() => import("../app/dashboard/inventory/brands/page"), { ssr: false }),
  },
  {
    path: "/dashboard/inventory",
    label: "Inventario",
    Component: dynamic(() => import("../app/dashboard/inventory/page"), { ssr: false }),
  },
  {
    path: "/dashboard/inventory/catalog",
    label: "Catálogo",
    Component: dynamic(() => import("../app/dashboard/inventory/catalog/page"), { ssr: false }),
  },
  {
    path: "/dashboard/cash",
    label: "Caja",
    Component: dynamic(() => import("../app/dashboard/cash/page"), { ssr: false }),
  },
  {
    path: "/dashboard/reports",
    label: "Reportes",
    Component: dynamic(() => import("../app/dashboard/reports/page"), { ssr: false }),
  },
  {
    path: "/dashboard/commissions",
    label: "Comisiones",
    Component: dynamic(() => import("../app/dashboard/commissions/page"), { ssr: false }),
  },
  {
    path: "/dashboard/users",
    label: "Usuarios",
    Component: dynamic(() => import("../app/dashboard/users/page"), { ssr: false }),
  },
  {
    path: "/dashboard/settings",
    label: "Configuración",
    Component: dynamic(() => import("../app/dashboard/settings/page"), { ssr: false }),
  },
  {
    path: "/dashboard/tickets",
    label: "Tickets",
    Component: dynamic(() => import("../app/dashboard/tickets/page"), { ssr: false }),
  },
];

/**
 * Finds the registry entry for a pathname. Tries an exact match first, then
 * falls back to the longest registered path that is a prefix of it (so an
 * unregistered sub-route still opens under its nearest known screen).
 */
export function findTabEntry(pathname: string): TabRegistryEntry | undefined {
  const exact = tabRegistry.find((t) => t.path === pathname);
  if (exact) return exact;

  const prefixMatches = tabRegistry
    .filter((t) => t.path !== "/dashboard" && pathname.startsWith(t.path + "/"))
    .sort((a, b) => b.path.length - a.path.length);
  if (prefixMatches.length > 0) return prefixMatches[0];

  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return tabRegistry.find((t) => t.path === "/dashboard");
  }
  return undefined;
}

/**
 * Routes that share a single TabBar tab. Each page in a group renders its own
 * internal sub-nav to the others (see e.g. catalog/page.tsx's "Inventario |
 * Catálogo | Categorías | Marcas" strip, or customers/page.tsx's "Clientes |
 * Grupos" strip), so moving between them should update the content of the
 * SAME tab instead of opening a new one. `key` is the group's canonical path
 * (used as the tab's stable id) and `label` is what the tab shows — matching
 * how the sidebar names the section, which can differ from any one member
 * page's own title (e.g. the sidebar's "Catálogo" link opens
 * /dashboard/inventory, whose own page title is "Inventario").
 */
const TAB_GROUPS: { key: string; label: string; paths: string[] }[] = [
  {
    key: "/dashboard/inventory",
    label: "Catálogo",
    paths: [
      "/dashboard/inventory",
      "/dashboard/inventory/catalog",
      "/dashboard/inventory/categories",
      "/dashboard/inventory/brands",
    ],
  },
  {
    key: "/dashboard/customers",
    label: "Clientes",
    paths: ["/dashboard/customers", "/dashboard/customers/groups"],
  },
];

function findGroup(pathname: string) {
  return TAB_GROUPS.find((group) => group.paths.includes(pathname));
}

export interface TabIdentity {
  /** Stable key for the TabBar tab: a group's canonical path, or the route's own path if ungrouped. */
  tabKey: string;
  /** Fixed label for the tab. */
  label: string;
}

/** Resolves which TabBar tab a pathname belongs to (grouped routes share one tab). */
export function getTabIdentity(pathname: string): TabIdentity | undefined {
  const group = findGroup(pathname);
  if (group) return { tabKey: group.key, label: group.label };

  const entry = findTabEntry(pathname);
  if (!entry) return undefined;
  return { tabKey: entry.path, label: entry.label };
}
