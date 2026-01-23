"use client";

import { fileTaxDeclaration } from "@/actions/tax-declarations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { QueryClient } from "@tanstack/react-query";
import { CheckCircle2, Send } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

export function FileDeclarationDialog({
  declarationId,
}: {
  declarationId: number;
}) {
  const queryClient = new QueryClient();

  const { execute } = useAction(fileTaxDeclaration, {
    onSuccess: () => {
      toast.success("Se guardó el acuse correctamente.");
      queryClient.invalidateQueries({
        queryKey: ["auditLogs", "tax_declaration", declarationId],
      });
    },
    onError: ({ error }) => {
      toast.error(
        error.serverError || "Hubo un error al guardar la información."
      );
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full gap-2 font-mono text-background">
          <Send className="h-4 w-4" />
          Registrar Acuse SAT
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <form action={execute}>
          <DialogHeader>
            <DialogTitle className="text-xl font-light tracking-tight">
              Registrar Acuse de Estimación
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Ingresa el número de acuse proporcionado por el SAT después de
              realizar tu declaración oficial.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <input name="declarationId" type="hidden" value={declarationId} />
            <div className="space-y-2">
              <Label
                htmlFor="acknowledgmentNumber"
                className="text-sm font-mono"
              >
                Número de Acuse SAT
              </Label>
              <Input
                id="acknowledgmentNumber"
                name="acknowledgmentNumber"
                placeholder="Ej: 12345678-ABCD-1234-EFGH-123456789012"
                className="font-mono"
                required
              />
              <p className="text-xs text-muted-foreground">
                Este número identifica tu registro oficial ante el SAT.
              </p>
            </div>
          </div>
          <DialogFooter>
            <SubmitButton className="w-full gap-2 font-mono">
              <CheckCircle2 className="h-4 w-4" />
              Confirmar Registro
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
