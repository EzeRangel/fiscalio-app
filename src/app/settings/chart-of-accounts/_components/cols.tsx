"use client";

import { Badge } from "@/components/ui/badge";
import { ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import { HierarchicalAccountFull } from "@/types/chart-of-accounts";
import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, ChevronDown, ChevronRight, Circle } from "lucide-react";

const accountTypeColors: Record<string, string> = {
  asset:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  liability: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  equity: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  income:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  expense:
    "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
};

export const columns: ColumnDef<HierarchicalAccountFull>[] = [
  {
    accessorKey: "accountCode",
    header: "Código",
    cell: ({ row }) => {
      const { level, accountCode } = row.original;
      const canExpand = row.getCanExpand();
      const isExpanded = row.getIsExpanded();

      return (
        <div className="flex items-center gap-2 font-mono">
          {canExpand ? (
            <button
              onClick={row.getToggleExpandedHandler()}
              className="hover:bg-muted p-1 rounded transition-colors"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-6" />
          )}
          <span className={level === 0 ? "font-bold" : "pl-3"}>
            {accountCode}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "accountName",
    header: "Nombre de la cuenta",
    cell: ({ row }) => {
      const { level, accountName, accountSubtype } = row.original;

      return (
        <div className="space-y-1">
          <div
            className={`text-sm leading-none ${
              level === 0 ? "font-semibold text-base" : ""
            }`}
          >
            {accountName}
          </div>
          {accountSubtype && (
            <div className="text-xs text-muted-foreground">
              {accountSubtype}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "accountType",
    header: "Tipo",
    cell: ({ row }) => {
      return (
        <Badge
          variant="outline"
          className={accountTypeColors[row.original.accountType]}
        >
          {ACCOUNT_TYPE_LABELS[row.original.accountType]}
        </Badge>
      );
    },
  },
  {
    accessorKey: "satCode",
    header: "Código SAT",
    cell: ({ row }) => {
      if (row.original.satCode) {
        return <span>{row.original.satCode}</span>;
      }

      return <span>-</span>;
    },
  },
  {
    accessorKey: "isDeductible",
    header: "Deducible",
    cell: ({ row }) => {
      if (row.original.isDeductible) {
        return (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-mono">
              {row.original.deductionPercentage || "100"}%
            </span>
          </div>
        );
      }

      return <Circle className="h-4 w-4 text-muted-foreground" />;
    },
  },
  {
    id: "isActive",
    header: "Estado",
    cell: ({ row }) => (
      <Badge
        variant={row.original.isActive ? "default" : "outline"}
        className="font-mono text-xs"
      >
        {row.original.isActive ? "Activa" : "Inactiva"}
      </Badge>
    ),
  },
];
