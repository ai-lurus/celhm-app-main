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
    path: "/dashboard/catalog",
    label: "Catálogo",
    Component: dynamic(() => import("../app/dashboard/catalog/page"), { ssr: false }),
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
