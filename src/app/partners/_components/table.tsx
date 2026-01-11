"use client";

import { DataTable } from "@/components/data-table";
import { BusinessPartner } from "@/types/businessPartners";
import { columns } from "./cols";

interface Props {
  data: BusinessPartner[];
}

export function Table({ data }: Props) {
  return (
    <div className="container mx-auto px-6 py-8">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
