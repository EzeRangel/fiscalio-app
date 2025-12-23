"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccountFormDialog } from "./form-dialog";
import { Account } from "@/types/chart-of-accounts";

interface Props {
  accounts: Account[];
}

export function Filters({ accounts }: Props) {
  return (
    <div className="border-b border-border bg-background sticky top-0 z-10">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <Select>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="asset">Activos</SelectItem>
              <SelectItem value="liability">Pasivos</SelectItem>
              <SelectItem value="equity">Capital</SelectItem>
              <SelectItem value="income">Ingresos</SelectItem>
              <SelectItem value="expense">Gastos</SelectItem>
            </SelectContent>
          </Select>

          <AccountFormDialog accounts={accounts} />
        </div>
      </div>
    </div>
  );
}
