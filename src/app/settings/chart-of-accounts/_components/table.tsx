"use client";

import { DataTable } from "@/components/data-table";
import { columns } from "./cols";
import { HierarchicalAccountFull } from "@/types/chart-of-accounts";

interface Props {
  accounts: HierarchicalAccountFull[];
}

export function Table({ accounts }: Props) {
  return (
    <div className="container mx-auto px-6 py-8">
      <DataTable columns={columns} data={accounts} />
    </div>
  );
}
