"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../../stores/auth";
import { Sidebar } from "../../components/Sidebar";
import { canAccessRoute, getDefaultRoute } from "../../lib/permissions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    // Check if user is authenticated
    // Only redirect if we're sure there's no session (after hydration)
    if (user === null && token === null) {
      router.push("/login");
    }
  }, [user, token, router]);

  // Route-level access control: redirect to role's default page if user lacks permission
  useEffect(() => {
    if (user && pathname && !canAccessRoute(user.role, pathname)) {
      router.replace(getDefaultRoute(user.role));
    }
  }, [user, pathname, router]);

  // Show loading only if we're still checking or if we have a token but no user yet
  if ((token && !user) || (user === null && token === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // If user doesn't have access to this route, show a brief loading while redirecting
  if (user && pathname && !canAccessRoute(user.role, pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
