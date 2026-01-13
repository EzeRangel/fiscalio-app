"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Users,
  FileBarChart,
  Settings,
  Home,
  ChevronRight,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Organization } from "@/types/organizations";
import { OrganizationSwitcher } from "./organizations/organization-switcher";
import { PrivacyModeToggle } from "./privacy-mode-toggle";

const navigation = [
  {
    title: "Principal",
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: Home,
      },
    ],
  },
  {
    title: "Operaciones",
    items: [
      {
        title: "Facturas",
        href: "/invoices",
        icon: FileText,
      },
      {
        title: "Socios de Negocio",
        href: "/partners",
        icon: Users,
      },
      {
        title: "Declaraciones",
        href: "/tax-declarations",
        icon: FileBarChart,
      },
    ],
  },
  {
    title: "Configuración",
    items: [
      {
        title: "Ajustes",
        href: "/settings",
        icon: Settings,
        subItems: [
          {
            title: "Catálogo de Cuentas",
            href: "/settings/chart-of-accounts",
          },
          {
            title: "Editar Perfil",
            href: "/settings/profile",
          },
        ],
      },
    ],
  },
];

interface Props {
  organizations: Organization[];
}

export function AppSidebar({ organizations }: Props) {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <OrganizationSwitcher data={organizations} />
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="text-xs uppercase tracking-widest font-mono">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  if ("subItems" in item) {
                    return (
                      <Collapsible
                        key={item.title}
                        asChild
                        defaultOpen={isActive}
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip={item.title}
                              className={
                                isActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : ""
                              }
                            >
                              {item.icon && <item.icon className="size-4" />}
                              <span>{item.title}</span>
                              <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.subItems!.map((subItem) => {
                                const isSubActive = pathname === subItem.href;
                                return (
                                  <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={isSubActive}
                                      className={
                                        isSubActive
                                          ? "bg-sidebar-accent/50 text-sidebar-accent-foreground"
                                          : ""
                                      }
                                    >
                                      <Link href={subItem.href}>
                                        <span>{subItem.title}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActive}
                        className={
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : ""
                        }
                      >
                        <Link href={item.href}>
                          {item.icon && <item.icon className="size-4" />}
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <PrivacyModeToggle />
      <SidebarRail />
    </Sidebar>
  );
}
