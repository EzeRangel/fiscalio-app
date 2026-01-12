"use client";

import * as React from "react";
import { Building2, ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Organization } from "@/types/organizations";
import { useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getActiveOrganization,
  setActiveOrganization,
} from "@/actions/session";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { PrivacyBlur } from "../privacy-blur";

interface Props {
  data: Organization[];
}

export function OrganizationSwitcher({ data }: Props) {
  const { isMobile } = useSidebar();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  // Query to get the currently active organization
  const { data: activeOrganization, isLoading } = useQuery({
    queryKey: ["activeOrganization"],
    queryFn: async () => {
      const { data } = await getActiveOrganization();

      if (!data) {
        throw new Error("No se obtuvo la organización activa");
      }

      return data;
    },
  });

  const { execute: executeSetActive } = useAction(setActiveOrganization, {
    onSuccess: () => {
      toast.success("Organización cambiada.", {
        description: "La página se va recargar para aplicar los cambios.",
      });

      // Invalidate the query to refetch the active organization
      queryClient.invalidateQueries({ queryKey: ["activeOrganization"] });

      // Delay reload slightly to allow toast to be seen and query to refetch
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: ({ error: { serverError } }) => {
      const message = serverError || "Error desconocido";

      toast.error("Ocurrió un error al cambiar la organización.", {
        description: message,
      });
    },
  });

  const handleValueChange = (orgId: string) => {
    startTransition(() => {
      executeSetActive({ organizationId: parseInt(orgId, 10) });
    });
  };

  const orgList = data || [];
  const activeOrgId = activeOrganization?.id;

  if (isLoading) {
    return (
      <div className="w-full max-w-50 h-10 bg-muted rounded-md animate-pulse" />
    );
  }

  if (!activeOrgId) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Building2 className="text-white size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeOrganization.businessName}
                </span>
                <span className="truncate text-xs">
                  <PrivacyBlur>{activeOrganization.rfc}</PrivacyBlur>
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizaciones
            </DropdownMenuLabel>
            {orgList.map((org, index) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => {
                  handleValueChange(org.id.toString());
                }}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Building2 className="size-3.5 shrink-0" />
                </div>
                {org.businessName}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                Nueva Organización
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
