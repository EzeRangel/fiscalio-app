"use client";

import { useTransition } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setActiveOrganization } from "@/actions/session";
import { Organization } from "@/types/organizations";

type OrganizationPickerProps = {
  organizations: Organization[];
  activeOrganizationId: number | null;
};

export function OrganizationPicker({
  organizations,
  activeOrganizationId,
}: OrganizationPickerProps) {
  const [isPending, startTransition] = useTransition();
  const { execute } = useAction(setActiveOrganization, {
    onSuccess: () => {
      toast.success("Organización cambiada", {
        description: "Recargaremos la página para aplicar los cambios.",
      });
      // Delay reload slightly to allow toast to be seen
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: ({ error: { serverError, validationErrors } }) => {
      const message = serverError ?? validationErrors?._errors?.[0];

      toast.error("Error al cambiar de organización", {
        description: message,
      });
    },
  });

  const handleValueChange = (orgId: string) => {
    startTransition(() => {
      execute({ organizationId: parseInt(orgId, 10) });
    });
  };

  if (organizations.length === 0) {
    return null; // Or render a placeholder/creation form
  }

  if (organizations.length === 1 && activeOrganizationId) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-muted-foreground">
          Organization:
        </span>
        <span className="text-sm font-semibold">
          {organizations[0].businessName}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[200px]">
      <Select
        onValueChange={handleValueChange}
        defaultValue={activeOrganizationId?.toString()}
        disabled={isPending}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecciona una organización" />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id.toString()}>
              {org.businessName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
