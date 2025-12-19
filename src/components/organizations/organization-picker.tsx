"use client";

import { useTransition } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  setActiveOrganization,
  getActiveOrganization,
} from "@/actions/session";
import { Organization } from "@/types/organizations";

interface Props {
  data: Organization[];
}

export function OrganizationPicker({ data }: Props) {
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

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

  if (orgList.length === 0) {
    return null; // Or a "Create Organization" button
  }

  return (
    <div className="w-full max-w-50">
      <Select
        disabled={isPending}
        onValueChange={handleValueChange}
        defaultValue={activeOrgId?.toString()}
      >
        <SelectTrigger>
          <SelectValue placeholder="Elige una organización" />
        </SelectTrigger>
        <SelectContent>
          {orgList.map((org) => (
            <SelectItem key={org.id} value={org.id.toString()}>
              {org.businessName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
