"use client";

import type React from "react";
import { useState, useRef, useTransition, useReducer } from "react";
import { readStreamableValue } from "@ai-sdk/rsc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  Loader2,
  FileCheck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { processInvoices } from "@/actions/proccess-invoices";
import { ProcessingInvoice } from "@/types/invoices";

interface InvoiceState {
  id: string;
  fileName: string;
  status:
    | "queued"
    | "parsing"
    | "validating"
    | "saving"
    | "classifying"
    | "success"
    | "error";
  progress: number;
  error?: string;
}

type State = {
  invoices: Map<string, InvoiceState>;
  isProcessing: boolean;
  summary: { successful: number; failed: number } | null;
};

function reducer(
  state: State,
  action: ProcessingInvoice | { type: "reset" }
): State {
  if (action?.type === "reset") {
    return {
      invoices: new Map(),
      isProcessing: false,
      summary: null,
    };
  }

  const invoices = new Map(state.invoices);

  switch (action.type) {
    case "started": {
      invoices.set(action.id, {
        id: action.id,
        fileName: action.fileName,
        status: "queued",
        progress: (action.current / action.total) * 100,
      });
      return { ...state, invoices, isProcessing: true };
    }

    case "status": {
      const invoice = state.invoices.get(action.id);
      if (!invoice) return state;

      invoices.set(action.id, { ...invoice, status: action.status });
      return { ...state, invoices };
    }

    case "success": {
      const invoice = state.invoices.get(action.id);
      if (!invoice) return state;

      invoices.set(action.id, {
        ...invoice,
        status: "success",
      });
      return { ...state, invoices };
    }

    case "error": {
      const invoice = state.invoices.get(action.id);
      if (!invoice) return state;

      invoices.set(action.id, {
        ...invoice,
        status: "error",
        error: action.error,
      });
      return { ...state, invoices };
    }

    case "complete": {
      return {
        ...state,
        isProcessing: false,
        summary: {
          successful: action.successful,
          failed: action.failed,
        },
      };
    }

    default:
      return state;
  }
}

function StatusBadge({ status }: { status: InvoiceState["status"] }) {
  const labels = {
    queued: "En cola",
    parsing: "Parseando XML",
    validating: "Validando SAT",
    saving: "Guardando",
    classifying: "Clasificando",
    success: "Completada",
    error: "Error",
  };

  return <span className="text-xs">{labels[status]}</span>;
}

function UploadItem({ upload }: { upload: InvoiceState }) {
  return (
    <div key={upload.id} className="group flex items-center py-4">
      <div className="mr-3 grid size-10 shrink-0 place-content-center rounded border bg-muted">
        {/* Ícono de Estado */}
        {upload.status === "success" && (
          <CheckCircle className="h-5 w-5 text-green-600" />
        )}
        {upload.status === "error" && (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
        {!["success", "error"].includes(upload.status) && (
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        )}
      </div>
      <div className="flex flex-col w-full mb-1">
        <div className="flex justify-between gap-2">
          <span className="select-none text-base/6 text-foreground group-disabled:opacity-50 sm:text-sm/6">
            {upload.fileName}
          </span>
          <StatusBadge status={upload.status} />
        </div>
        {upload.error && (
          <p className="text-sm text-red-600 mt-1">{upload.error}</p>
        )}
      </div>
    </div>
  );
}

export default function CFDIUploader() {
  const [state, dispatch] = useReducer(reducer, {
    invoices: new Map(),
    isProcessing: false,
    summary: null,
  });

  const [isDragging, setIsDragging] = useState(false);
  const filePickerRef = useRef<HTMLInputElement>(null);

  const [isPending, startTransition] = useTransition();

  const openFilePicker = () => {
    filePickerRef.current?.click();
  };

  const handleUpload = async (files: FileList) => {
    dispatch({ type: "reset" });

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("invoices", file));

    const { stream } = await processInvoices(formData);

    for await (const update of readStreamableValue(stream)) {
      if (!update) continue;

      startTransition(() => {
        dispatch(update);
      });
    }
  };

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      handleUpload(selectedFiles);
    }
  };

  const onDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    // It's good practice to set dropEffect for visual feedback, though not strictly required
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const onDropFiles = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false); // Reset dragging state after drop
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles) {
      handleUpload(droppedFiles);
    }
  };

  return (
    <div className="mx-auto flex w-full flex-col gap-y-6">
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300 border-2 border-dashed",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50"
        )}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDropFiles}
        onClick={openFilePicker}
      >
        <div className="p-12">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            {/* Icon */}
            <div
              className={cn(
                "rounded-full p-6 transition-all duration-300",
                isDragging ? "bg-primary/20 scale-110" : "bg-muted"
              )}
            >
              <Upload
                className={cn(
                  "h-10 w-10 transition-colors",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>

            {/* Text */}
            <div className="space-y-2 max-w-md">
              <h3 className="text-2xl font-light tracking-tight">
                {isDragging
                  ? "Suelta tus archivos aquí"
                  : "Cargar Facturas XML"}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Arrastra y suelta archivos XML o haz clic para seleccionar. Se
                procesarán automáticamente en segundo plano.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  openFilePicker();
                }}
                size="lg"
                className="gap-2 font-mono text-xs uppercase tracking-widest"
                disabled={isPending}
              >
                <FileCheck className="h-4 w-4" />
                Seleccionar Archivos
              </Button>
            </div>

            {/* Supported Format */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <FileText className="h-3.5 w-3.5" />
              <span>Formato soportado: XML (CFDI 3.3, 4.0)</span>
            </div>
          </div>
        </div>

        <input
          ref={filePickerRef}
          type="file"
          multiple
          hidden
          accept=".xml,text/xml"
          onChange={onFileInputChange}
          className="hidden"
        />
      </Card>

      <div className="flex flex-col gap-y-4">
        {state.isProcessing && state.invoices.size === 0 && (
          <div>
            <h2 className="text-foreground text-lg flex items-center font-mono font-normal uppercase sm:text-xs mb-4">
              <Loader2 className="size-4 mr-1 animate-spin" />
              Iniciando...
            </h2>
          </div>
        )}
        {state.invoices.size > 0 && (
          <div>
            {state.summary === null ? (
              <h2 className="text-foreground text-lg flex items-center font-mono font-normal uppercase sm:text-xs mb-4">
                <Loader2 className="size-4 mr-1 animate-spin" />
                Cargando
              </h2>
            ) : null}
            <div className="-mt-2 divide-y">
              {Array.from(state.invoices.values()).map((upload) => (
                <UploadItem key={upload.id} upload={upload} />
              ))}
            </div>
          </div>
        )}

        {state.summary && (
          <div>
            <h2 className="text-foreground text-lg flex items-center font-mono font-normal uppercase sm:text-xs mb-4">
              <CheckCircle className="mr-1 size-4" />
              Proceso Completado
            </h2>
            <p className="text-sm text-muted-foreground">
              {state.summary.successful} facturas procesadas,{" "}
              {state.summary.failed} con errores.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
