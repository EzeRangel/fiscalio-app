"use client";

import type { LucideIcon } from "lucide-react";
import { Card } from "./ui/card";
import { PrivacyBlur } from "./privacy-blur";
import { cn } from "@/lib/utils";

const COLORS = {
  neutral: {
    card: "bg-linear-to-br from-primary/5 via-background to-background border-primary/20",
    icon: "text-muted-foreground",
    value: "text-muted-foreground",
  },
  green: {
    card: "bg-linear-to-br from-emerald-500/5 via-background to-background border-emerald-500/20",
    icon: "text-emerald-600 dark:text-emerald-400",
    value: "text-emerald-600 dark:text-emerald-400",
  },
  red: {
    card: "bg-linear-to-br from-red-500/5 via-background to-background border-red-500/20",
    icon: "text-red-600 dark:text-red-400",
    value: "text-red-600 dark:text-red-400",
  },
  amber: {
    card: "bg-linear-to-br from-amber-500/5 via-background to-background border-amber-500/20",
    icon: "text-amber-600 dark:text-amber-400",
    value: "text-amber-600 dark:text-amber-400",
  },
  blue: {
    card: "bg-linear-to-br from-chart-2/5 via-background to-background border-chart-2/20",
    icon: "text-chart-2 dark:text-chart-4",
    value: "text-chart-2 dark:text-chart-4",
  },
};

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  color?: keyof typeof COLORS;
  footer?: string;
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "neutral",
  footer,
}: Props) {
  const elementColors = COLORS[color];

  return (
    <Card className={cn("p-6 space-y-4", "@container", elementColors.card)}>
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          {title}
        </div>
        {Icon && <Icon className={cn("h-4 w-4", elementColors.icon)} />}
      </div>
      <div className="space-y-1">
        <div
          className={cn(
            "@lg:text-3xl text-2xl font-mono font-medium",
            elementColors.value,
          )}
        >
          <PrivacyBlur>{value}</PrivacyBlur>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {subtitle}
        </div>
      </div>
      {footer && (
        <div className="pt-3 border-t border-border/50">
          <p className="text-[10px] leading-tight text-muted-foreground/60 italic uppercase tracking-wider">
            {footer}
          </p>
        </div>
      )}
    </Card>
  );
}
