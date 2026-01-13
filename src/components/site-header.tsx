"use client";

import { cn } from "@/lib/utils";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";
import { UserNav } from "./user-nav";
import { SiteBreadcrumb } from "./site-breadcrumb";
import { Separator } from "./ui/separator";

export function SiteHeader() {
  const { open } = useSidebar();

  return (
    <div
      className={cn(
        "bg-background sticky top-0 z-50 flex w-full items-center border-b"
      )}
    >
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <SiteBreadcrumb />
        <div className="flex-1" />
        <UserNav />
      </div>
    </div>
  );
}
