"use client";

import React from "react";
import { Building2, Plus, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { setActiveOrganization } from "@/actions/session";
import { Card } from "@/components/ui/card";
import { PrivacyBlur } from "@/components/privacy-blur";
import { toast } from "sonner";
import { Organization } from "@/types/organizations";

interface Props {
  organizations: Organization[];
  onSwitchToForm: () => void;
}

export function OrgSelector({ organizations, onSwitchToForm }: Props) {
  const router = useRouter();

  const { execute, status } = useAction(setActiveOrganization, {
    onSuccess: () => {
      toast.success("Organización seleccionada con éxito.");
      router.replace("/");
    },
    onError: ({ error: { serverError } }) => {
      toast.error(serverError || "Error al seleccionar la organización.");
    },
  });

  const handleSelectOrg = (orgId: number) => {
    execute({ organizationId: orgId });
  };

  const isExecuting = status === "executing";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {organizations.map((org) => (
          <button
            key={org.id}
            onClick={() => handleSelectOrg(org.id)}
            disabled={isExecuting}
            className="text-left w-full focus:outline-none group"
          >
            <Card className="h-full p-6 transition-all duration-200 border-border/50 bg-card/80 backdrop-blur-sm hover:bg-accent/40 hover:border-accent group-hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[200px] sm:max-w-[160px]">
                    {org.businessName}
                  </h3>
                  <p className="text-xs font-mono text-muted-foreground">
                    <PrivacyBlur>{org.rfc}</PrivacyBlur>
                  </p>
                </div>
              </div>
              <div className="flex items-center text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Acceder <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Card>
          </button>
        ))}

        <button
          onClick={onSwitchToForm}
          disabled={isExecuting}
          className="text-left w-full focus:outline-none group"
        >
          <Card className="h-full p-6 border-dashed border-border/70 hover:border-primary/50 bg-transparent hover:bg-accent/20 cursor-pointer flex flex-col items-center justify-center text-center space-y-3 min-h-[140px] transition-all">
            <div className="p-3 rounded-full border border-dashed border-border group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors">
              <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Crear nueva organización
            </span>
          </Card>
        </button>
      </div>
    </div>
  );
}
