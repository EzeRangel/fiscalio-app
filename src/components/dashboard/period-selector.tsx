"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PeriodSelection } from "@/types/dashboard";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const YEARS = Array.from({ length: 5 }, (_, i) => 2023 + i);

interface Props {
  period: PeriodSelection;
  onPeriodChange: (period: PeriodSelection) => void;
}

export function PeriodSelector({ period, onPeriodChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={period.month.toString()}
        onValueChange={(value) => onPeriodChange({ ...period, month: parseInt(value) })}
      >
        <SelectTrigger className="w-[140px] bg-background">
          <SelectValue placeholder="Mes" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((month, index) => (
            <SelectItem key={index} value={index.toString()}>
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={period.year.toString()}
        onValueChange={(value) => onPeriodChange({ ...period, year: parseInt(value) })}
      >
        <SelectTrigger className="w-[100px] bg-background">
          <SelectValue placeholder="Año" />
        </SelectTrigger>
        <SelectContent>
          {YEARS.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
