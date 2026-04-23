"use server";

import { createStreamableUI } from "@ai-sdk/rsc";
import { suggestInvoiceClassification } from "@/data/classification-snapshots";
import { saveNewInvoice } from "@/data/invoices";
import { CFDIParser } from "@/lib/cfdi-parser";
import { delay } from "@/lib/utils";
import { CheckCircle, Loader2 } from "lucide-react";
import { InvoiceState, UploadItem } from "@/components/upload-item";
import { getActiveOrganizationId } from "@/lib/session";
import {
  checkFileHashUniqueness,
  checkFolioFiscalUniqueness,
  generateFileHash,
} from "@/lib/data-integrity";
import { revalidatePath } from "next/cache";

async function parseXML(cfdi: File) {
  const xmlContent = await cfdi.text();
  const parsedCFDI = await CFDIParser.parse(xmlContent);

  return parsedCFDI;
}

export async function processInvoices(formData: FormData) {
  const uiStream = createStreamableUI();
  const files = formData.getAll("invoices") as File[];

  const invoicesMap = new Map<string, InvoiceState>();
  files.forEach((file) => {
    const id = crypto.randomUUID();
    invoicesMap.set(id, {
      id,
      fileName: file.name,
      status: "queued",
      progress: 0,
    });
  });

  (async () => {
    const organizationId = await getActiveOrganizationId();
    const initialInvoices = Array.from(invoicesMap.values());
    uiStream.update(
      <div>
        <h2 className="text-foreground text-lg flex items-center font-mono font-normal uppercase sm:text-xs mb-4">
          <Loader2 className="size-4 mr-1 animate-spin" />
          Cargando {files.length} {files.length === 1 ? "factura" : "facturas"}
          ...
        </h2>
        <div className="mt-2 divide-y">
          {initialInvoices.map((invoice) => (
            <UploadItem key={invoice.id} upload={invoice} />
          ))}
        </div>
      </div>,
    );
    await delay(1); // Give client time to render initial state

    let successful = 0;
    let failed = 0;

    const renderInvoices = () => {
      const invoiceList = Array.from(invoicesMap.values());
      const isDone = successful + failed === files.length;

      uiStream.update(
        <div>
          <h2 className="text-foreground text-lg flex items-center font-mono font-normal uppercase sm:text-xs mb-4">
            {isDone ? (
              <CheckCircle className="mr-1 size-4" />
            ) : (
              <Loader2 className="size-4 mr-1 animate-spin" />
            )}
            {isDone
              ? "Proceso Completado"
              : `Procesando ${successful + failed + 1} de ${files.length}`}
          </h2>
          {isDone && (
            <p className="text-sm text-muted-foreground">
              {successful} facturas procesadas, {failed} con errores.
            </p>
          )}
          <div className="mt-2 divide-y">
            {invoiceList.map((invoice) => (
              <UploadItem key={invoice.id} upload={invoice} />
            ))}
          </div>
        </div>,
      );
    };

    for (const [id, invoice] of invoicesMap.entries()) {
      const file = files.find((f) => f.name === invoice.fileName);
      if (!file) continue;

      const updateStatus = async (
        status: InvoiceState["status"],
        error?: string,
      ) => {
        invoicesMap.set(id, { ...invoice, id, status, error });
        renderInvoices();
        // await delay(1);
      };

      try {
        await updateStatus("parsing");
        const contents = await file.text();

        // 1. File De-duplication (Hash check)
        const fileHash = generateFileHash(contents);
        await checkFileHashUniqueness(organizationId, fileHash);

        const cfdi = await parseXML(file);
        const essentials = CFDIParser.extractEssentials(cfdi);

        // 2. UUID Uniqueness check
        await checkFolioFiscalUniqueness(organizationId, essentials.uuid);

        await updateStatus("validating");
        // TODO: validation logic here

        await updateStatus("saving");
        const buf = Buffer.from(contents, "utf-8");
        const xmlbase64 = buf.toString("base64");
        const savedInvoice = await saveNewInvoice(cfdi, xmlbase64, fileHash);

        await updateStatus("classifying");
        await suggestInvoiceClassification(savedInvoice.id);

        if (savedInvoice.status === "invalid") {
          successful++;
          await updateStatus(
            "invalid",
            "Guardada con inconsistencias fiscales.",
          );
        } else {
          successful++;
          await updateStatus("success");
        }
      } catch (error) {
        failed++;
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        await updateStatus("error", errorMessage);
      }
    }
    uiStream.done();
  })();

  return { ui: uiStream.value };
}
