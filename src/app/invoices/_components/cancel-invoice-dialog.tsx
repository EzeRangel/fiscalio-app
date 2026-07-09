"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { cancelInvoiceAction } from "@/actions/cancellation";
import { SAT_CANCELLATION_MOTIVES } from "@/types/cancellation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const cancelFormSchema = z.object({
  reasonCode: z.enum(["01", "02", "03", "04"]),
  cancellationReason: z.string().min(1, "La descripción del motivo es requerida"),
  substituteInvoiceUuid: z.string().optional(),
  confirmCheckbox: z.boolean().refine((val) => val === true, {
    message: "Debe confirmar que desea cancelar esta factura ante el SAT.",
  }),
});

interface CancelInvoiceDialogProps {
  invoiceId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelInvoiceDialog({
  invoiceId,
  open,
  onOpenChange,
}: CancelInvoiceDialogProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof cancelFormSchema>>({
    resolver: zodResolver(cancelFormSchema),
    defaultValues: {
      reasonCode: "02",
      cancellationReason: "",
      substituteInvoiceUuid: "",
      confirmCheckbox: false,
    },
  });

  const selectedReason = form.watch("reasonCode");

  const { execute } = useAction(cancelInvoiceAction, {
    onExecute: () => setIsPending(true),
    onSuccess: ({ data }) => {
      setIsPending(false);
      if (data?.success) {
        toast.success("Factura cancelada correctamente");
        onOpenChange(false);
        router.refresh();
      }
    },
    onError: ({ error: { serverError } }) => {
      setIsPending(false);
      toast.error(serverError || "Error al cancelar la factura");
    },
  });

  function onSubmit(values: z.infer<typeof cancelFormSchema>) {
    if (values.reasonCode === "01" && (!values.substituteInvoiceUuid || values.substituteInvoiceUuid.trim() === "")) {
      form.setError("substituteInvoiceUuid", {
        type: "manual",
        message: "El UUID de la factura sustituta es requerido para el motivo 01.",
      });
      return;
    }

    execute({
      invoiceId,
      reasonCode: values.reasonCode,
      cancellationReason: values.cancellationReason,
      substituteInvoiceUuid: values.reasonCode === "01" ? values.substituteInvoiceUuid : null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cancelar Factura ante el SAT</DialogTitle>
          <DialogDescription>
            Seleccione el motivo de cancelación oficial y proporcione una descripción. Esta acción es irreversible.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reasonCode"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Motivo de Cancelación</FormLabel>
                  <FormControl>
                    <div className="flex flex-col space-y-2">
                      {Object.entries(SAT_CANCELLATION_MOTIVES).map(([code, label]) => (
                        <label
                          key={code}
                          className={`flex items-start space-x-2 text-sm cursor-pointer p-2.5 border rounded-lg hover:bg-accent/50 transition-colors ${
                            field.value === code ? "border-primary bg-primary/5" : "border-border"
                          }`}
                        >
                          <input
                            type="radio"
                            name="reasonCode"
                            value={code}
                            checked={field.value === code}
                            onChange={() => field.onChange(code)}
                            className="mt-1 accent-primary"
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold">{code}</span>
                            <span className="text-muted-foreground text-xs">{label}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedReason === "01" && (
              <FormField
                control={form.control}
                name="substituteInvoiceUuid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UUID de Factura Sustituta</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ej. 123e4567-e89b-12d3-a456-426614174000"
                        {...field}
                      />
                    </FormControl>
                    <span className="text-[11px] text-muted-foreground">
                      Pega el Folio Fiscal (UUID) de la nueva factura que sustituye a ésta.
                    </span>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="cancellationReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción del Motivo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escribe el motivo detallado de la cancelación..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmCheckbox"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/35">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="mt-1 accent-primary"
                      id="confirm-cancellation-checkbox"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel htmlFor="confirm-cancellation-checkbox" className="cursor-pointer font-medium text-destructive">
                      Confirmar de conformidad
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Confirmo que deseo cancelar esta factura ante el SAT.
                    </p>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cerrar
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Cancelación
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
