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
            <div className="flex items-end justify-between gap-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h1 className="text-5xl font-light tracking-tight leading-[1.1]">
                    Declaraciones Fiscales
                    <span className="block text-muted-foreground text-2xl mt-2">
                      Cálculos informativos
                    </span>
                  </h1>
                </div>
              </div>
              <p className="text-xs font-mono text-muted-foreground">
                4 declaraciones presentadas
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
