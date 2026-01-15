"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  User,
  Zap,
  FileInput,
  GitBranch,
} from "lucide-react";
import { AuditLog } from "@/types/audit-log";

type AuditLogPaneProps = {
  logs: AuditLog[];
  entityId: string;
  entityType: string;
};

const actionConfig = {
  created: {
    label: "Creado",
    icon: Zap,
    color: "text-emerald-600 dark:text-emerald-400",
  },
  updated: {
    label: "Actualizado",
    icon: GitBranch,
    color: "text-blue-600 dark:text-blue-400",
  },
  deleted: {
    label: "Eliminado",
    icon: X,
    color: "text-red-600 dark:text-red-400",
  },
  classified: {
    label: "Clasificado",
    icon: Zap,
    color: "text-purple-600 dark:text-purple-400",
  },
  reconciled: {
    label: "Conciliado",
    icon: GitBranch,
    color: "text-teal-600 dark:text-teal-400",
  },
};

const sourceConfig = {
  manual: {
    label: "Manual",
    icon: User,
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  ai: {
    label: "AI",
    icon: Zap,
    color:
      "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  },
  import: {
    label: "Importación",
    icon: FileInput,
    color:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  reconciliation: {
    label: "Conciliación",
    icon: GitBranch,
    color: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatValue(value: any): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function formatTimestamp(timestamp: Date): string {
  const date = new Date(timestamp);
  return date.toLocaleString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function AuditLogPane({
  logs,
  entityId,
  entityType,
}: AuditLogPaneProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Toggle Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
        <div className="container mx-auto max-w-7xl">
          <div className="flex justify-end pb-6 pointer-events-auto">
            <Button
              onClick={() => setIsOpen(!isOpen)}
              className="gap-2 shadow-2xl bg-foreground text-background hover:bg-foreground/90 font-mono text-xs tracking-wider"
              size="lg"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
              {isOpen ? "Ocultar" : "Mostrar"} logs de auditoría
              <Badge
                variant="secondary"
                className="ml-1 bg-background/20 text-background border-0"
              >
                {logs.length}
              </Badge>
            </Button>
          </div>
        </div>
      </div>

      {/* Audit Log Pane - Slides from bottom */}
      <div
        className={`fixed overflow-y bottom-0 left-0 right-0 z-30 bg-card border-t-2 border-border shadow-2xl transition-transform duration-500 ease-out min-h-[70vh] ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "100vh" }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="shrink-0 px-6 py-4 border-b border-border bg-muted/30">
            <div className="container mx-auto max-w-7xl">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-mono font-medium tracking-tight">
                    Historial de Auditoría
                  </h2>
                  <p className="text-xs text-muted-foreground font-mono">
                    Entidad:{" "}
                    <span className="text-foreground">{entityType}</span> • ID:{" "}
                    <span className="text-foreground">{entityId}</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Logs Container - Scrollable Timeline */}
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto max-w-7xl px-6 py-6">
              {logs.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground font-mono">
                    No hay logs de auditoría para esta entidad
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {logs.map((log, index) => {
                    const logAction = log.action as keyof typeof actionConfig;
                    const action = actionConfig[logAction];
                    const source = log.metadata.source
                      ? sourceConfig[log.metadata.source]
                      : null;
                    const hasChanges = Object.keys(log.changes).length > 0;
                    const ActionIcon = action.icon;

                    return (
                      <div key={log.id} className="flex gap-6">
                        {/* Left: Date Column */}
                        <div className="flex-shrink-0 w-32 pt-1">
                          <div className="text-xs font-mono text-muted-foreground text-right leading-tight">
                            {formatTimestamp(log.createdAt)}
                          </div>
                        </div>

                        {/* Right: Log Card */}
                        <div className="flex-1 relative">
                          {/* Timeline connector */}
                          <div className="absolute -left-3 top-0 bottom-0 w-px bg-border" />
                          <div className="absolute -left-4 top-3 w-2 h-2 rounded-full bg-foreground/10 border-2 border-foreground/20" />

                          <div className="bg-muted/20 border border-border rounded-lg p-4 hover:border-primary/20 transition-colors">
                            {/* Action Label with Icon */}
                            <div className="flex items-center gap-2 mb-2">
                              <ActionIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                {action.label}
                              </span>

                              {source && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs font-mono ${source.color}`}
                                >
                                  {source.label}
                                </Badge>
                              )}

                              {log.metadata.aiConfidence !== undefined && (
                                <Badge
                                  variant="outline"
                                  className="text-xs font-mono bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
                                >
                                  {(log.metadata.aiConfidence * 100).toFixed(0)}
                                  %
                                </Badge>
                              )}
                            </div>

                            {/* Reason as Title */}
                            {log.metadata.reason && (
                              <h3 className="text-sm font-medium text-foreground mb-3">
                                {log.metadata.reason}
                              </h3>
                            )}

                            {/* User Info */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-3">
                              <User className="h-3 w-3" />
                              {log.userIdentifier}
                            </div>

                            {/* Changes - Compact inline view */}
                            {hasChanges && (
                              <div className="space-y-2 pt-3 border-t border-border/50">
                                {Object.entries(log.changes).map(
                                  ([field, change]) => (
                                    <div
                                      key={field}
                                      className="text-xs font-mono bg-muted/30 rounded px-3 py-2 border border-border/30"
                                    >
                                      <div className="font-medium text-foreground mb-1.5">
                                        {field}
                                      </div>
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <span className="line-through opacity-60">
                                          {formatValue(change.old)}
                                        </span>
                                        <span className="text-muted-foreground/50">
                                          →
                                        </span>
                                        <span className="text-foreground font-medium">
                                          {formatValue(change.new)}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
