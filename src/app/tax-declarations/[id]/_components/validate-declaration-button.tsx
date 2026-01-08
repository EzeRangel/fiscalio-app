"use client";

import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { validateTaxDeclaration } from "@/actions/tax-declarations";
import { Loader2, ShieldCheck } from "lucide-react";

interface ValidateDeclarationButtonProps {
  declarationId: number;
}

export function ValidateDeclarationButton({
  declarationId,
}: ValidateDeclarationButtonProps) {
  const router = useRouter();
  const { execute, status } = useAction(validateTaxDeclaration, {
    onSuccess: () => {
      toast.success("La declaración ha sido validada exitosamente.");
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(
        error.serverError || "Hubo un error al validar la declaración."
      );
    },
  });

  const isExecuting = status === "executing";

  return (
    <Button
      onClick={() => execute({ declarationId })}
      disabled={isExecuting}
      size="lg"
      className="w-full"
    >
      {isExecuting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <ShieldCheck className="mr-2 h-4 w-4" />
      )}
      {isExecuting ? "Validando..." : "Validar y Bloquear Declaración"}
    </Button>
  );
}
