"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAction } from "next-safe-action/hooks";
import {
  getUnlinkedPaymentComplementsAction,
  linkPaymentAction,
} from "@/actions/payments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2,
  ArrowRightLeft,
  Calendar,
  DollarSign,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface LinkPaymentComplementDialogProps {
  invoiceId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkPaymentComplementDialog({
  invoiceId,
  open,
  onOpenChange,
}: LinkPaymentComplementDialogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmingPaymentInvoiceId, setConfirmingPaymentInvoiceId] = useState<
    number | null
  >(null);
  const [isPending, setIsPending] = useState(false);

  const { data: complements = [], isLoading } = useQuery({
    queryKey: ["unlinkedPaymentComplements", invoiceId],
    queryFn: async () => {
      const res = await getUnlinkedPaymentComplementsAction({ invoiceId });
      return res?.data?.data || [];
    },
    enabled: open,
  });

  const { execute } = useAction(linkPaymentAction, {
    onExecute: () => setIsPending(true),
    onSuccess: ({ data }) => {
      setIsPending(false);
      if (data?.success) {
        toast.success("Complemento de pago vinculado correctamente");
        setConfirmingPaymentInvoiceId(null);
        onOpenChange(false);
        router.refresh();
      }
    },
    onError: ({ error: { serverError } }) => {
      setIsPending(false);
      toast.error(serverError || "Error al vincular el complemento de pago");
    },
  });

  const filteredComplements = complements.filter((item) =>
    item.partnerName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleLink = (paymentInvoiceId: number, paymentId: number | null) => {
    execute({ paymentId, paymentInvoiceId, invoiceId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-6 gap-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            Vincular Complemento de Pago
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Seleccione un complemento de pago importado previamente para
            asociarlo con esta factura.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 py-1">
          <Input
            placeholder="Buscar por cliente o proveedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-[350px] max-h-[450px] border rounded-lg p-3 bg-muted/20">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[350px] space-y-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm">Buscando complementos de pago...</span>
            </div>
          ) : filteredComplements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground text-center p-4">
              <ArrowRightLeft className="h-12 w-12 text-slate-300 mb-3" />
              <p className="font-semibold text-sm">
                No se encontraron complementos pendientes de vincular
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-[320px]">
                Asegúrese de que el XML del complemento de pago ya esté
                importado en el sistema y pertenezca a este mismo socio
                comercial.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pr-1">
              {filteredComplements.map((item) => (
                <div
                  key={item.paymentInvoiceId}
                  className="flex items-center justify-between p-4 border rounded-xl bg-card hover:bg-accent/30 transition-all shadow-sm gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground truncate max-w-[250px]">
                        {item.partnerName}
                      </span>
                      <span
                        className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono"
                        title={item.uuid}
                      >
                        {item.uuid.substring(0, 8)}...
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground flex-wrap gap-y-1">
                      <span className="flex items-center">
                        <Calendar className="mr-1 h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {format(new Date(item.paymentDate), "dd/MM/yyyy")}
                      </span>
                      <span className="flex items-center font-medium text-emerald-600 dark:text-emerald-500">
                        <DollarSign className="h-3 w-3 shrink-0" />
                        {parseFloat(item.amount).toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        MXN
                      </span>
                      <span className="flex items-center">
                        <FileText className="mr-1 h-3.5 w-3.5 text-slate-400 shrink-0" />
                        Relacionado: $
                        {parseFloat(item.amountAllocated).toLocaleString(
                          "es-MX",
                          {
                            minimumFractionDigits: 2,
                          },
                        )}
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground shrink-0">
                        {item.resolvedDocsCount} de {item.totalDocsCount}{" "}
                        facturas asignadas
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {confirmingPaymentInvoiceId === item.paymentInvoiceId ? (
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            handleLink(item.paymentInvoiceId, item.paymentId)
                          }
                          disabled={isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-8"
                        >
                          {isPending && (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          )}
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmingPaymentInvoiceId(null)}
                          disabled={isPending}
                          className="h-8 text-xs"
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setConfirmingPaymentInvoiceId(item.paymentInvoiceId)
                        }
                        className="flex items-center gap-1.5 hover:bg-primary hover:text-white transition-all duration-200 text-xs h-8"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        Vincular
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
