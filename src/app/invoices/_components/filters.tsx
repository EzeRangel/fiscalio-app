"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Filter, Search, X } from "lucide-react";

type PeriodGroup = "month" | "year" | "none";

interface FiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  cfdiTypeFilter: string;
  onCfdiTypeChange: (value: string) => void;
  periodGroup: PeriodGroup;
  onPeriodGroupChange: (value: PeriodGroup) => void;
}

export default function Filters({
  searchQuery,
  onSearchChange,
  cfdiTypeFilter,
  onCfdiTypeChange,
  periodGroup,
  onPeriodGroupChange,
}: FiltersProps) {
  const hasActiveFilters = searchQuery || cfdiTypeFilter !== "all";

  return (
    <div className="border-b border-border bg-background sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por RFC, emisor o folio..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-9 font-mono text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <Select value={cfdiTypeFilter} onValueChange={onCfdiTypeChange}>
            <SelectTrigger className="w-[160px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Tipo" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="income">Ingreso</SelectItem>
              <SelectItem value="expense">Egreso</SelectItem>
            </SelectContent>
          </Select>

          {/* Period Grouping */}
          <Select
            value={periodGroup}
            onValueChange={(v) => onPeriodGroupChange(v as PeriodGroup)}
          >
            <SelectTrigger className="w-[160px]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Agrupar" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin agrupar</SelectItem>
              <SelectItem value="month">Por mes</SelectItem>
              <SelectItem value="year">Por año</SelectItem>
            </SelectContent>
          </Select>

          {/* Active Filters Count */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSearchChange("");
                onCfdiTypeChange("all");
              }}
              className="text-xs h-9 gap-2 border-dashed"
            >
              <X className="h-3 w-3" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
