"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useAction } from "next-safe-action/hooks";
import { registerRefundAction } from "@/actions/cancellation";
import { PAYMENT_FORMS } from "@/lib/constants";
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

const refundFormSchema = z.object({
  amount: z.string().refine((val) => {
    const parsed = parseFloat(val);
    return !isNaN(parsed) && parsed > 0;
  }, "El monto debe ser mayor a cero"),
  paymentDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
  paymentMethod: z.string().min(1, "El método de pago (Forma de pago) es requerido"),
  notes: z.string().optional(),
});

interface RegisterRefundDialogProps {
  invoiceId: number;
  amountPaid: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegisterRefundDialog({
  invoiceId,
  amountPaid,
  open,
  onOpenChange,
}: RegisterRefundDialogProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof refundFormSchema>>({
    resolver: zodResolver(refundFormSchema),
    defaultValues: {
      amount: amountPaid || "0.00",
      paymentDate: format(new Date(), "yyyy-MM-dd"),
      paymentMethod: "03", // Default to Transferencia
      notes: "",
    },
  });

  const { execute } = useAction(registerRefundAction, {
    onExecute: () => setIsPending(true),
    onSuccess: ({ data }) => {
      setIsPending(false);
      if (data?.success) {
        toast.success("Devolución registrada correctamente");
        onOpenChange(false);
        router.refresh();
      }
    },
    onError: ({ error: { serverError } }) => {
      setIsPending(false);
      toast.error(serverError || "Error al registrar la devolución");
    },
  });

  function onSubmit(values: z.infer<typeof refundFormSchema>) {
    const refundAmount = parseFloat(values.amount);
    const totalPaid = parseFloat(amountPaid || "0");

    if (refundAmount > totalPaid + 0.001) {
      form.setError("amount", {
        type: "manual",
        message: `El monto del reembolso no puede exceder el total pagado ($${amountPaid}).`,
      });
      return;
    }

    const dateStr = values.paymentDate;
    const newDate = new Date(`${dateStr}T12:00:00`);

    execute({
      invoiceId,
      amount: values.amount,
      paymentDate: newDate,
      paymentMethod: values.paymentMethod,
      notes: values.notes || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Devolución (Refund)</DialogTitle>
          <DialogDescription>
            Registre el reembolso total o parcial realizado para esta factura. Esto generará automáticamente un ajuste fiscal.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto de la Devolución</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <span className="text-[11px] text-muted-foreground">
                    Monto pagado acumulado: ${amountPaid}
                  </span>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha del Reembolso</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pago (SAT)</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {Object.entries(PAYMENT_FORMS).map(([code, label]) => (
                        <option key={code} value={code}>
                          {code} - {label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales sobre la devolución..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Devolución
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
