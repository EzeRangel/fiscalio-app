"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useAction } from "next-safe-action/hooks";
import { updatePaymentAction } from "@/actions/payments";
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
import { PaymentAllocation } from "@/types/payments";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  paymentDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
  notes: z.string().optional(),
});

interface EditPaymentDialogProps {
  payment: PaymentAllocation;
  invoiceDate: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPaymentDialog({
  payment,
  invoiceDate,
  open,
  onOpenChange,
}: EditPaymentDialogProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paymentDate: payment.paymentDate
        ? format(new Date(payment.paymentDate), "yyyy-MM-dd")
        : "",
      notes: payment.notes || "",
    },
  });

  const { execute } = useAction(updatePaymentAction, {
    onExecute: () => setIsPending(true),
    onSuccess: ({ data }) => {
      setIsPending(false);
      if (data?.success) {
        toast.success("Pago actualizado correctamente");
        onOpenChange(false);
        router.refresh();
      }
    },
    onError: ({ error: { serverError } }) => {
      setIsPending(false);
      toast.error(serverError || "Error al actualizar el pago");
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Construct date from input string, ensuring it's treated as local date (or at least consistent)
    // Adding T12:00:00 to ensure it falls on the selected day in local time usually works for simple dates
    const dateStr = values.paymentDate;
    const newDate = new Date(`${dateStr}T12:00:00`);

    // Basic validation against invoice date
    // Note: invoiceDate might be a Date object or string depending on serialization, but here typed as Date
    // If it comes from server component props, it might be serialized. 
    // Ideally we convert both to timestamps or simplified date strings to compare.
    const invDate = new Date(invoiceDate);
    // Reset times for comparison
    const newDateOnly = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
    const invDateOnly = new Date(invDate.getFullYear(), invDate.getMonth(), invDate.getDate());

    if (newDateOnly < invDateOnly) {
       form.setError("paymentDate", {
         type: "manual",
         message: "La fecha de pago no puede ser anterior a la fecha de la factura."
       });
       return;
    }

    execute({
      paymentId: payment.id,
      paymentDate: newDate,
      notes: values.notes,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Corregir Pago</DialogTitle>
          <DialogDescription>
            Actualice la fecha y notas del pago. El monto no se puede modificar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <div className="flex flex-col space-y-1.5">
                <FormLabel>Monto</FormLabel>
                <div className="text-sm font-mono bg-muted p-2 rounded">
                    ${payment.amount} {payment.currency}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Pago</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                    <Textarea placeholder="Razón de la corrección..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
