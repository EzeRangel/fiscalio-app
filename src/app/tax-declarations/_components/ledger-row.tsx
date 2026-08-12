import { cn } from "@/lib/utils";

/** A single numbered line-item within the fiscal ledger — mirrors the numbering
 *  convention used on the printed declaration report for visual continuity. */
export function LedgerRow({
  index,
  label,
  meta,
  amount,
  toneClassName,
  emphasis,
}: {
  index: string;
  label: string;
  meta?: string;
  amount: string;
  toneClassName?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-6 px-6 py-4 sm:px-8",
        emphasis
          ? "bg-muted/60 border-y border-border"
          : "border-b border-border/70 last:border-b-0",
      )}
    >
      <div className="flex items-baseline gap-4 min-w-0">
        <span className="font-mono text-xs text-muted-foreground/70 tabular-nums">
          {index}
        </span>
        <div className="min-w-0">
          <div
            className={cn(
              "text-sm",
              emphasis ? "font-medium text-foreground" : "text-foreground/90",
            )}
          >
            {label}
          </div>
          {meta && (
            <div className="text-xs text-muted-foreground font-mono mt-0.5">
              {meta}
            </div>
          )}
        </div>
      </div>
      <span
        className={cn(
          "font-mono tabular-nums whitespace-nowrap",
          emphasis ? "text-lg font-semibold" : "text-base font-medium",
          toneClassName,
        )}
      >
        {amount}
      </span>
    </div>
  );
}
