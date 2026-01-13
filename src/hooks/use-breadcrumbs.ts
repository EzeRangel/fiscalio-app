import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { BREADCRUMB_ROUTES } from "@/config/breadcrumb-routes";

export interface BreadcrumbItem {
  label: string;
  href: string;
  active: boolean;
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();

  return useMemo(() => {
    // Always start with Dashboard
    const items: BreadcrumbItem[] = [
      {
        label: "Dashboard",
        href: "/",
        active: pathname === "/",
      },
    ];

    if (pathname === "/") {
      return items;
    }

    const segments = pathname.split("/").filter(Boolean);
    let currentPath = "";

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Check config for friendly name, otherwise use segment
      const label = BREADCRUMB_ROUTES[segment] || segment;

      items.push({
        label,
        href: currentPath,
        active: isLast,
      });
    });

    return items;
  }, [pathname]);
}
