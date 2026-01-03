"use client";

import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createTaxDeclarationDraft } from "@/actions/tax-declarations";
import { Loader2, PlusCircle } from "lucide-react";

interface GenerateDraftButtonProps {
  period: string;
  declarationType: "monthly" | "bimonthly" | "annual";
}

export function GenerateDraftButton({
  period,
  declarationType,
}: GenerateDraftButtonProps) {
  const router = useRouter();
  const { execute, status } = useAction(createTaxDeclarationDraft, {
    onSuccess: ({ data }) => {
      toast.success(`Borrador para ${data.fiscalPeriod} creado exitosamente.`);
      router.push(`/tax-declarations/${data.id}`);
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Hubo un error al crear el borrador.");
    },
  });

  const isExecuting = status === "executing";

  return (
    <Button
      onClick={() => execute({ fiscalPeriod: period, declarationType })}
      disabled={isExecuting}
      size="lg"
    >
      {isExecuting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <PlusCircle className="mr-2 h-4 w-4" />
      )}
      {isExecuting ? "Generando..." : "Generar Borrador"}
    </Button>
  );
}
