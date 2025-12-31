"use client";

import type React from "react";
import { useState, useRef, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, FileCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { processInvoices } from "@/actions/proccess-invoices";

export default function CFDIUploader() {
  const [ui, setUi] = useState<ReactNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const filePickerRef = useRef<HTMLInputElement>(null);

  const [isPending, startTransition] = useTransition();

  const openFilePicker = () => {
    filePickerRef.current?.click();
  };

  const handleUpload = (files: FileList) => {
    setUi(null);

    startTransition(async () => {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("invoices", file));

      const { ui } = await processInvoices(formData);
      setUi(ui);
    });
  };

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleUpload(selectedFiles);
    }
    // Reset file input to allow re-uploading the same file
    if (filePickerRef.current) {
      filePickerRef.current.value = "";
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
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const onDropFiles = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
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

      {isPending && !ui && (
        <div>
          <h2 className="text-foreground text-lg flex items-center font-mono font-normal uppercase sm:text-xs mb-4">
            <Loader2 className="size-4 mr-1 animate-spin" />
            Iniciando...
          </h2>
        </div>
      )}

      {ui && <div className="flex flex-col gap-y-4">{ui}</div>}
    </div>
  );
}
