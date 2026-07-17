import type { UserRole } from "./auth";
import { can } from "./permissions";
import { menuGroups } from "./menu";

export interface PortfolioGroup {
  groupKey: string;
  groupLabelKey: string;
  items: { key: string; labelKey: string; path: string }[];
}

/** Menu sections a role can access (same rules as AppSidebar). */
export function getAccessibleNavForRole(role: UserRole): PortfolioGroup[] {
  return menuGroups
    .map((group) => {
      if (group.permission && !can(role, group.permission)) return null;

      const items = group.items
        .filter((item) => !item.permission || can(role, item.permission))
        .map((item) => ({
          key: item.key,
          labelKey: item.transKey,
          path: item.path,
        }));

      if (items.length === 0) return null;

      return {
        groupKey: group.key,
        groupLabelKey: group.transKey,
        items,
      };
    })
    .filter(Boolean) as PortfolioGroup[];
}

export function countAccessiblePages(role: UserRole): number {
  return getAccessibleNavForRole(role).reduce((sum, g) => sum + g.items.length, 0);
}
