import { Account } from "@/types/chart-of-accounts";
import { Sparkles } from "lucide-react";

interface Props {
  account: Account;
}

export default function ClassificationAssigned({ account }: Props) {
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
                Clasificación Asignada
              </h3>
              <p className="text-sm text-muted-foreground">
                Cuenta contable de esta factura
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              {account?.accountCode}
            </div>
            <div className="text-2xl font-mono font-light">
              {account?.accountName}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
