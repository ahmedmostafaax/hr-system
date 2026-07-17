"use client";

import { ReactNode } from "react";
import { getUser } from "@/lib/auth";
import { can, Permission } from "@/lib/permissions";

interface RoleGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ permission, children, fallback }: RoleGuardProps) {
  const user = getUser();

  if (!user || !can(user.role, permission)) {
    return (
      fallback ?? (
        <div className="flex items-center justify-center h-64 text-red-500 font-medium">
          ليس لديك صلاحية لعرض هذه الصفحة
        </div>
      )
    );
  }

  return <>{children}</>;
}
