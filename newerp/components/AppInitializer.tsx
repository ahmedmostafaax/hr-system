"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { getUser, isLoggedIn } from "@/lib/auth";
import { useLookupStore } from "@/lib/store";

const AUTH_PAGES = [
  "/login",
  "/forgot-password",
  "/verify-code",
  "/reset-password",
];

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((p) => pathname.includes(p));
}

export function AppInitializer() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const loaded = useLookupStore((s) => s.loaded);
  const load = useLookupStore((s) => s.load);

  useEffect(() => {
    if (!isLoggedIn()) return;

    const user = getUser();
    const onChangePassword = pathname.includes("/change-password");

    if (user?.force_reset_password && !onChangePassword) {
      router.replace(`/${locale}/change-password`);
      return;
    }

    if (!loaded && !isAuthPage(pathname) && !onChangePassword) {
      load();
    }
  }, [pathname, locale, loaded, load, router]);

  return null;
}
