"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth, getUser, logoutUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { menuGroups } from "@/lib/menu";
import { useLookupStore } from "@/lib/store";
import LanguageToggle from "../LanguageToggle";

import {
  IconBuilding,
  IconShift,
  IconLeave,
  IconHoliday,
  IconAccount,
  IconAllowance,
  IconAbsence,
  IconBonus,
  IconInsurance,
  IconEmployees,
  IconDocument,
  IconRelative,
  IconExperience,
  IconContract,
  IconCustody,
  IconLoan,
  IconLeaveReq,
  IconLogout,
  IconMenu,
  IconChevronRight,
  IconDashboard,
} from "./Icons";

const itemIcons: Record<string, React.ReactNode> = {
  dashboard: <IconDashboard />,
  employees: <IconEmployees />,
  employeeDocument: <IconDocument />,
  employeeRelative: <IconRelative />,
  employeeExperience: <IconExperience />,
  contracts: <IconContract />,
  contract_allowances: <IconAllowance />,
  contract_leaves: <IconLeave />,
  attendance: <IconShift />,
  leave_requests: <IconLeaveReq />,
  absences: <IconAbsence />,
  custody: <IconCustody />,
  employeeLoan: <IconLoan />,
  employeeBonus: <IconBonus />,
  payroll: <IconAllowance />,
  journalEntries: <IconDocument />,
  accountingPeriods: <IconLeave />,
  account: <IconAccount />,
  reports: <IconDashboard />,
  departments: <IconBuilding />,
  shifts: <IconShift />,
  leaveTypes: <IconLeave />,
  officialHolidays: <IconHoliday />,
  allowanceTypes: <IconAllowance />,
  absence_types: <IconAbsence />,
  bonus_types: <IconBonus />,
  insurance_settings: <IconInsurance />,
  users: <IconEmployees />,
  auditLog: <IconDocument />,
  myProfile: <IconEmployees />,
  myLeave: <IconLeaveReq />,
  myLoans: <IconLoan />,
  myAttendance: <IconShift />,
};

function NavTooltip({
  content,
  children,
  show,
  isRTL,
}: {
  content: string;
  children: React.ReactNode;
  show: boolean;
  isRTL: boolean;
}) {
  const [visible, setVisible] = useState(false);
  if (!show) return <>{children}</>;
  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 z-999 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[13px] font-medium text-white shadow-xl pointer-events-none whitespace-nowrap ${isRTL ? "right-full mr-3" : "left-full ml-3"}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export function AppSidebar() {
  const t = useTranslations("sidebar");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    home: true,
    hr: true,
    financial: false,
    payroll: false,
    accounting: false,
    reports: false,
    settings: false,
    admin: false,
  });

  const isRTL = locale === "ar";

  useEffect(() => {
    setMounted(true);
  }, []);

  const navGroups = useMemo(() => {
    if (!user) return [];

    return menuGroups
      .map((group) => {
        if (group.permission && !can(user.role, group.permission)) return null;

        const items = group.items
          .filter((item) => !item.permission || can(user.role, item.permission))
          .map((item) => ({
            key: item.key,
            label: t(item.transKey),
            href: item.path ? `/${locale}${item.path}` : `/${locale}`,
            icon: itemIcons[item.key] ?? <IconDashboard />,
          }));

        if (items.length === 0) return null;

        return {
          groupKey: group.key,
          label: t(group.transKey),
          items,
        };
      })
      .filter(Boolean) as {
      groupKey: string;
      label: string;
      items: { key: string; label: string; href: string; icon: React.ReactNode }[];
    }[];
  }, [user, locale, t]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // optional
    } finally {
      clearAuth();
      useLookupStore.getState().reset();
      router.push(`/${locale}/login`);
    }
  };

  const handleNav = () => {
    setMobileOpen(false);
  };

  const toggleGroup = (key: string) => {
    if (collapsed) return;
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!mounted) return null;

  const SidebarContent = () => (
    <div className="relative flex flex-col h-full bg-white border-r rtl:border-r-0 rtl:border-l border-slate-200 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-primary via-primary/70 to-primary opacity-70 z-10" />

      <div
        className={`flex items-center gap-3 px-[16px] py-5 h-[64px] border-b border-slate-200 shrink-0 overflow-hidden ${collapsed ? "justify-center" : ""}`}
      >
        <div className="w-[30px] h-[30px] min-w-[30px] rounded-lg bg-linear-to-br from-primary to-primary/80 flex items-center justify-center shadow-[0_0_0_3px_rgba(0,0,0,0.05)]">
          <span className="text-white font-black text-[13px]">E</span>
        </div>
        <div
          className={`flex flex-col transition-all duration-250 overflow-hidden ${collapsed ? "opacity-0 w-0 pointer-events-none" : "opacity-100"}`}
        >
          <span className="text-slate-800 font-bold text-[16px] whitespace-nowrap leading-tight tracking-tight">
            ERB<span className="text-primary">Payroll</span>
          </span>
          {!collapsed && user && (
            <span className="text-slate-500 text-[12px] whitespace-nowrap truncate max-w-[150px]">
              {user.name} · {user.role}
            </span>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="px-2.5 pt-2.5 shrink-0">
          <div className="flex bg-slate-100 rounded-lg border border-slate-200 overflow-hidden h-[30px]">
            <LanguageToggle lng={locale} />
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-2 px-2 flex flex-col [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {navGroups.map((group, gi) => {
          const isOpen = openGroups[group.groupKey] ?? false;

          return (
            <div key={group.groupKey} className={gi > 0 ? "mt-1" : ""}>
              {!collapsed ? (
                <button
                  onClick={() => toggleGroup(group.groupKey)}
                  className={`w-full flex items-center justify-between px-2 py-[6px] rounded-lg mb-0.5 text-[13px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-150 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <span>{group.label}</span>
                  <IconChevronRight
                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-90" : isRTL ? "rotate-180" : ""}`}
                  />
                </button>
              ) : (
                <div className="mx-2 my-2 border-t border-slate-200" />
              )}

              <div
                style={{
                  maxHeight: !collapsed && !isOpen ? "0px" : "9999px",
                  overflow: "hidden",
                  transition: "max-height 0.25s ease",
                }}
              >
                {group.items.map((item) => {
                  const active =
                    item.href === `/${locale}`
                      ? pathname === `/${locale}` || pathname === `/${locale}/`
                      : pathname.startsWith(item.href);

                  const btn = (
                    <Link
                      href={item.href}
                      prefetch
                      onClick={handleNav}
                      className={`
                        group relative w-full flex items-center gap-2
                        px-[9px] py-[7px] rounded-lg mb-px
                        text-[14.5px] font-medium transition-all duration-100 text-left overflow-hidden whitespace-nowrap
                        ${isRTL ? "flex-row-reverse text-right" : ""}
                        ${collapsed ? "justify-center" : ""}
                        ${
                          active
                            ? "bg-indigo-50 text-indigo-600 font-semibold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        }
                      `}
                    >
                      {active && !collapsed && (
                        <span
                          className={`absolute top-0 bottom-0 w-[4px] bg-indigo-600 ${isRTL ? "right-0" : "left-0"}`}
                        />
                      )}
                      <span
                        className={`shrink-0 flex items-center transition-transform duration-100 ${!active && "group-hover:scale-110 group-hover:text-primary"}`}
                      >
                        {item.icon}
                      </span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );

                  return collapsed ? (
                    <NavTooltip key={item.key} content={item.label} show isRTL={isRTL}>
                      {btn}
                    </NavTooltip>
                  ) : (
                    <div key={item.key}>{btn}</div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-2 pb-3 flex flex-col gap-1 shrink-0">
        <button
          onClick={handleLogout}
          className={`group flex items-center gap-2 w-full px-[9px] py-[7px] rounded-lg text-[13.5px] font-medium text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150 overflow-hidden whitespace-nowrap ${collapsed ? "justify-center" : isRTL ? "flex-row-reverse" : ""}`}
        >
          <span className="shrink-0">
            <IconLogout />
          </span>
          {!collapsed && <span>{t("logout", { defaultValue: "Logout" })}</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex w-full items-center justify-center py-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-300 ease-in-out ${collapsed ? "rotate-180" : ""} ${isRTL ? "scale-x-[-1]" : ""}`}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className={`md:hidden fixed top-4 z-40 w-10 h-10 flex items-center justify-center rounded-lg bg-white/90 backdrop-blur-md border border-slate-200 text-slate-600 shadow-lg hover:bg-slate-50 transition-colors ${isRTL ? "right-4" : "left-4"}`}
      >
        <IconMenu />
      </button>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`hidden md:flex flex-col shrink-0 h-screen z-20 transition-all duration-300 ease-in-out shadow-xl shadow-black/20 ${collapsed ? "w-[58px]" : "w-[230px]"}`}
      >
        <SidebarContent />
      </aside>

      <aside
        className={`md:hidden fixed top-0 bottom-0 z-50 w-[230px] h-screen transition-transform duration-300 ease-in-out shadow-2xl ${isRTL ? "right-0" : "left-0"} ${mobileOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"}`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
