"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Invoice } from "@/types/invoices";
import {
  applyClassification,
  getInvoiceClassificationSuggestion,
} from "@/actions/classification-rules";
import usePrice from "@/hooks/usePrice";
import { fetchChartOfAccounts } from "@/actions/chart-of-accounts";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClassificationCandidate } from "@/types/classification-engine";

interface Props {
  invoice: Pick<Invoice, "id" | "total" | "accountId">;
}

interface FeedbackInput {
  invoiceId: number;
  action: "select" | "non-correct";
  selectedAccount: string;
}

export function ClassificationFeedback({ invoice }: Props) {
  const queryClient = useQueryClient();
  const invoiceTotal = usePrice(Number(invoice.total), 2);

  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualAccountCode, setManualAccountCode] = useState("");
  const [candidateIdx, setCandidateIdx] = useState<number | null>(null);
  const [suggestion, pickSuggestion] = useState<FeedbackInput | null>(null);

  const currentClassification = invoice.accountId;

  const { data: accounts = [] } = useQuery({
    queryKey: ["chart-of-accounts"],
    queryFn: () => fetchChartOfAccounts(),
  });

  const {
    data: candidates,
    isLoading: isSuggestionLoading,
    isError,
  } = useQuery<ClassificationCandidate[]>({
    queryKey: ["classification-suggestion", invoice.id],
    queryFn: async () => {
      const result = await getInvoiceClassificationSuggestion({
        invoiceId: invoice.id,
      });

      if (result.serverError) {
        throw new Error(result.serverError);
      }
      // The action returns an array of candidates or null
      return result.data || [];
    },
    enabled: !currentClassification,
  });

  const { executeAsync: apply, status: applyStatus } = useAction(
    applyClassification,
    {
      onSuccess: () => {
        toast.success("Clasificación aplicada");
        queryClient.invalidateQueries({
          queryKey: ["classification-suggestion", invoice.id],
        });
        queryClient.invalidateQueries({ queryKey: ["invoices", invoice.id] });
      },
      onError: ({ error }) =>
        toast.error(error?.serverError ?? "Ocurrió un error al clasificar"),
    }
  );

  const handleManualSubmit = async () => {
    const pickedSuggestion: FeedbackInput = {
      invoiceId: invoice.id,
      selectedAccount: manualAccountCode,
      action: "non-correct",
    };

    const { data, serverError } = await apply(pickedSuggestion);

    if (!!data) {
      toast.success(data.message);
    } else {
      if (serverError) {
        toast.error("Ocurrió un error", { description: serverError });
      }
    }
  };

  const handleSubmit = async () => {
    if (suggestion) {
      const { data, serverError } = await apply(suggestion);

      if (!!data) {
        toast.success(data.message);
      } else {
        if (serverError) {
          toast.error("Ocurrió un error", { description: serverError });
        }
      }
    }
  };

  const handlePick = (candidate: ClassificationCandidate) => {
    pickSuggestion({
      invoiceId: invoice.id,
      selectedAccount: candidate.accountCode,
      action: "select",
    });
  };

  const getConfidenceLevel = (score: number) => {
    if (score >= 0.8)
      return { label: "Alta", color: "text-emerald-600 dark:text-emerald-400" };
    if (score >= 0.6)
      return { label: "Media", color: "text-amber-600 dark:text-amber-400" };
    return { label: "Baja", color: "text-rose-600 dark:text-rose-400" };
  };

  const hasNoCandidates = !!candidates && candidates.length < 1;

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/[0.02] to-background shadow-sm">
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />

      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-light tracking-tight mb-0.5">
                Clasificación Sugerida
              </h3>
              <p className="text-sm text-muted-foreground">
                Selecciona la cuenta contable correcta
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Importe
            </div>
            <div className="text-2xl font-mono font-light">{invoiceTotal}</div>
          </div>
        </div>

        {(() => {
          if (hasNoCandidates) {
            return (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-3 duration-300">
                <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="text-sm">
                    No hay suficiente información para sugerir una cuenta.
                    Selecciona la cuenta correcta.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Select
                      value={manualAccountCode}
                      onValueChange={setManualAccountCode}
                    >
                      <SelectTrigger className="py-4 text-lg font-mono border-2 focus:border-primary w-full">
                        <SelectValue placeholder="Selecciona una cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem
                            key={account.id}
                            value={account.accountCode}
                          >
                            {account.accountCode} - {account.accountName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setShowManualEntry(false);
                        setManualAccountCode("");
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="lg"
                      onClick={handleManualSubmit}
                      disabled={
                        !manualAccountCode.trim() || applyStatus === "executing"
                      }
                      className="flex-1 gap-2"
                    >
                      Confirmar Cuenta
                      {applyStatus === "executing" ? (
                        <Loader2 className="h-5 w-5 animate-spin spin-in" />
                      ) : (
                        <Check className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          }

          if (showManualEntry) {
            return (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-3 duration-300">
                <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="text-sm">
                    Ninguna sugerencia es correcta. Por favor, ingresa la cuenta
                    contable adecuada.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Select
                      value={manualAccountCode}
                      onValueChange={setManualAccountCode}
                    >
                      <SelectTrigger className="py-4 text-lg font-mono border-2 focus:border-primary w-full">
                        <SelectValue placeholder="Selecciona una cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem
                            key={account.id}
                            value={account.accountCode}
                          >
                            {account.accountCode} - {account.accountName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setShowManualEntry(false);
                        setManualAccountCode("");
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="lg"
                      onClick={handleManualSubmit}
                      disabled={
                        !manualAccountCode.trim() || applyStatus === "executing"
                      }
                      className="flex-1 gap-2"
                    >
                      Confirmar Cuenta
                      {applyStatus === "executing" ? (
                        <Loader2 className="h-5 w-5 animate-spin spin-in" />
                      ) : (
                        <Check className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {candidates?.map((candidate, index) => {
                  const confidence = getConfidenceLevel(candidate.score);
                  const isTop = index === 0;
                  const isPicked = candidateIdx === index;
                  const accountName = accounts?.find(
                    (acc) => acc.accountCode === candidate.accountCode
                  )?.accountName;

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setCandidateIdx(index);
                        handlePick(candidate);
                      }}
                      className={`
                      group relative text-left rounded-xl border-2 transition-all duration-200 cursor-pointer
                      ${
                        isTop
                          ? "border-primary/40 bg-primary/3 shadow-md hover:shadow-lg hover:border-primary"
                          : "border-border bg-card hover:border-primary/50 hover:bg-primary/2 hover:shadow-md"
                      }
                    `}
                    >
                      {/* Top badge for best match */}
                      {isTop && (
                        <div className="absolute -top-3 left-4">
                          <Badge className="bg-primary text-primary-foreground shadow-sm px-3 py-1 text-xs font-medium">
                            Recomendada
                          </Badge>
                        </div>
                      )}

                      <div className="p-6 space-y-4">
                        {/* Account code - large and prominent */}
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">
                            {candidate.accountCode}
                          </div>

                          <div className="text-3xl font-mono font-light tracking-tight">
                            {accountName}
                          </div>

                          {/* Department */}
                          {candidate.department && (
                            <div className="text-sm text-muted-foreground">
                              {candidate.department}
                            </div>
                          )}
                        </div>

                        {/* Cost center if available */}
                        {candidate.costCenter && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="uppercase tracking-wider">CC</span>
                            <span className="font-mono">
                              {candidate.costCenter}
                            </span>
                          </div>
                        )}

                        {/* Confidence indicator */}
                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                          <span className="text-xs uppercase tracking-wider text-muted-foreground">
                            Confianza
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-medium ${confidence.color}`}
                            >
                              {confidence.label}
                            </span>
                            <div
                              className={`h-2 w-16 rounded-full bg-muted overflow-hidden`}
                            >
                              <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${candidate.score * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Hover state: show checkmark */}
                      {isPicked && (
                        <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md animate-in zoom-in duration-150">
                          <Check className="h-5 w-5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    pickSuggestion(null);
                    setCandidateIdx(null);
                    setShowManualEntry(false);
                    setManualAccountCode("");
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  className="flex-1 gap-2"
                  disabled={applyStatus === "executing"}
                >
                  Confirmar Cuenta
                  {applyStatus === "executing" ? (
                    <Loader2 className="h-5 w-5 animate-spin spin-in" />
                  ) : (
                    <Check className="h-5 w-5" />
                  )}
                </Button>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setShowManualEntry(true)}
                  className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <AlertCircle className="h-4 w-4" />
                  Ninguna es correcta
                </Button>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
