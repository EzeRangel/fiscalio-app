"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

export function ExportPdfButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="font-mono text-xs tracking-wide h-8 border-stone-300 bg-white hover:bg-stone-50"
      onClick={() => window.print()}
    >
      <FileDown className="h-3.5 w-3.5 mr-2" />
      EXPORTAR PDF
    </Button>
  );
}
