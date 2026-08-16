import { rolePermissions, PermissionKey, getDefaultRoute } from "../../../../lib/permissions";
import { Role } from "@celhm/types";

const ROLE_ORDER: Role[] = ["ADMINISTRADOR", "VENDEDOR", "CAJERO", "ALMACENISTA", "TECNICO"];

const ROLE_LABELS: Record<Role, string> = {
  ADMINISTRADOR: "Administrador",
  VENDEDOR: "Vendedor",
  CAJERO: "Cajero",
  ALMACENISTA: "Almacenista",
  TECNICO: "Técnico",
};

const PERMISSION_LABELS: Record<PermissionKey, string> = {
  canViewDashboard: "Ver dashboard",
  canViewReports: "Ver reportes",
  canViewFinancialReports: "Ver reportes financieros",
  canManageSales: "Gestionar ventas",
  canManageCash: "Gestionar caja",
  canManageTickets: "Gestionar tickets / laboratorio",
  canManageCustomers: "Gestionar clientes",
  canManageInventory: "Gestionar inventario",
  canManageCatalog: "Ver catálogo",
  canDeleteOrders: "Eliminar órdenes",
  canEditPrices: "Editar precios",
  canViewAllBranches: "Ver todas las sucursales",
  canUpdateTickets: "Actualizar tickets",
  canManageSettings: "Configuración",
  canManageUsers: "Gestionar usuarios",
  canManageCommissions: "Gestionar comisiones",
};

const PERMISSION_ORDER = Object.keys(PERMISSION_LABELS) as PermissionKey[];

function PermissionCell({ granted }: { granted: boolean }) {
  return granted ? (
    <span className="text-green-600 dark:text-green-400 font-semibold" aria-label="Permitido">
      ✓
    </span>
  ) : (
    <span className="text-gray-300 dark:text-gray-600" aria-label="No permitido">
      —
    </span>
  );
}

export function RolesPermissionsTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Permiso
                </th>
                {ROLE_ORDER.map((role) => (
                  <th
                    key={role}
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {ROLE_LABELS[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {PERMISSION_ORDER.map((permission) => (
                <tr key={permission} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {PERMISSION_LABELS[permission]}
                  </td>
                  {ROLE_ORDER.map((role) => (
                    <td key={role} className="px-4 py-3 text-center">
                      <PermissionCell granted={rolePermissions[role][permission]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Página de aterrizaje por rol
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          {ROLE_ORDER.map((role) => (
            <li key={role}>
              <span className="font-medium text-gray-900 dark:text-white">{ROLE_LABELS[role]}:</span>{" "}
              <code className="font-mono text-xs">{getDefaultRoute(role)}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
