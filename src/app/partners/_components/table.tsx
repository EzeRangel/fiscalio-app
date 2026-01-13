"use client";

import { DataTable } from "@/components/data-table";
import { BusinessPartnerWithStats } from "@/types/businessPartners";
import { getColumns } from "./cols";
import { useState } from "react";
import { BusinessPartnerTagsSheet } from "./tags-sheet";

interface Props {
  data: BusinessPartnerWithStats[];
}

export function Table({ data }: Props) {
  const [selectedPartner, setSelectedPartner] =
    useState<BusinessPartnerWithStats | null>(null);
  const [isTagsOpen, setIsTagsOpen] = useState(false);

  const columns = getColumns({
    onManageTags: (partner) => {
      setSelectedPartner(partner);
      setIsTagsOpen(true);
    },
    onDeactivate: (partner) => {
      // TODO: Implement deactivation if needed, for now just log
      console.log("Deactivate", partner.id);
    },
  });

  return (
    <div className="container mx-auto px-6 py-8">
      <DataTable columns={columns} data={data} />

      <BusinessPartnerTagsSheet
        partner={selectedPartner}
        open={isTagsOpen}
        onOpenChange={setIsTagsOpen}
      />
    </div>
  );
}
