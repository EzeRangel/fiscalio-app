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
import { Calendar, Filter, Search } from "lucide-react";

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
  return (
    <div className="border-b border-border bg-background sticky top-0 z-10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por RFC, emisor o folio..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 font-mono text-sm"
            />
          </div>

          {/* Type Filter */}
          <Select value={cfdiTypeFilter} onValueChange={onCfdiTypeChange}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tipo" />
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
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Agrupar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin agrupar</SelectItem>
              <SelectItem value="month">Por mes</SelectItem>
              <SelectItem value="year">Por año</SelectItem>
            </SelectContent>
          </Select>

          {/* Active Filters Count */}
          {(searchQuery || cfdiTypeFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onSearchChange("");
                onCfdiTypeChange("all");
              }}
              className="text-xs"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
