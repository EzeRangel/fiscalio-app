"use client";

import { useState } from "react";
import { DeclarationsDemo } from "@/components/demo/declarations-demo";
import { DeclarationDetailDemo } from "@/components/demo/declaration-detail-demo";

export default function DemoDeclarationsPage() {
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedId, setSelectedId] = useState<number>(101);

  const handleSelect = (id: number) => {
    setSelectedId(id);
    setView("detail");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - only shown in list view to keep detail view clean for print/snapshots */}
      {view === "list" && (
        <div className="border-b border-border bg-linear-to-br from-muted/30 via-background to-background">
          <div className="container mx-auto px-6 py-12">
            <div className="max-w-2xl space-y-4">
              <h1 className="text-5xl font-light tracking-tight leading-[1.1]">
                Declaraciones Fiscales
                <span className="block text-muted-foreground text-xl mt-2 font-mono tracking-widest uppercase">
                  Vista Demo / Snapshot de Producto
                </span>
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                Esta es una simulación interactiva con fines de demostración de la vista de Declaraciones Fiscales y su respectivo detalle.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 py-12">
        {view === "list" ? (
          <DeclarationsDemo onSelectDeclaration={handleSelect} />
        ) : (
          <DeclarationDetailDemo
            declarationId={selectedId}
            onBack={() => setView("list")}
          />
        )}
      </div>
    </div>
  );
}
