"use client";

import CFDIUploader from "../file-upload";

export default function Uploader() {
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-light tracking-tight">Cargar CFDIs</h2>
          <p className="text-sm text-muted-foreground font-mono">
            Importa tus comprobantes fiscales digitales en formato XML para
            procesarlos automáticamente.
          </p>
        </div>
      </div>
      <CFDIUploader />
    </div>
  );
}
