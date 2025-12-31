"use server";

import { createStreamableValue } from "@ai-sdk/rsc";
import { suggestInvoiceClassification } from "@/data/classification-snapshots";
import { saveNewInvoice } from "@/data/invoices";
import { CFDIParser } from "@/lib/cfdi-parser";
import { delay } from "@/lib/utils";
import { ProcessingInvoice } from "@/types/invoices";

async function parseXML(cfdi: File) {
  const xmlContent = await cfdi.text();
  const parsedCFDI = await CFDIParser.parse(xmlContent);

  return parsedCFDI;
}

export async function processInvoices(formData: FormData) {
  const stream = createStreamableValue<ProcessingInvoice>();

  (async () => {
    const files = formData.getAll("invoices") as File[];
    let successful = 0;
    let failed = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const invoiceId = crypto.randomUUID();

        try {
          await delay(1);

          // 📤 Update: Start
          stream.update({
            type: "started",
            id: invoiceId,
            fileName: file.name,
            total: files.length,
            current: i + 1,
          });

          await delay(1);

          // 1️⃣ PARSING
          stream.update({ type: "status", id: invoiceId, status: "parsing" });
          const contents = await file.text();
          const cfdi = await parseXML(file);

          await delay(1);

          // TODO: 2️⃣ VALIDACIÓN SAT
          stream.update({
            type: "status",
            id: invoiceId,
            status: "validating",
          });

          await delay(1);

          // 3️⃣ SAVE ON DB
          stream.update({ type: "status", id: invoiceId, status: "saving" });
          const buf = Buffer.from(contents, "base64");
          const xmlbase64 = buf.toString("base64");

          await delay(1);
          const recordInvoiceId = await saveNewInvoice(cfdi, xmlbase64);

          // 4️⃣ CLASSIFICATION
          stream.update({
            type: "status",
            id: invoiceId,
            status: "classifying",
          });

          await delay(1);
          await suggestInvoiceClassification(recordInvoiceId);

          // 📤 Update: Success
          stream.update({
            type: "success",
            id: invoiceId,
          });

          successful += 1;
        } catch (error) {
          // 📤 Update: Error
          stream.update({
            type: "error",
            id: invoiceId,
            error: error instanceof Error ? error.message : "Error desconocido",
            fileName: file.name,
          });

          failed += 1;

          // TODO: Save error on DB for audit
          // await db.insert(invoices).values({
          //   id: invoiceId,
          //   xmlFileName: file.name,
          //   processingStatus: "failed",
          //   errorMessage:
          //     error instanceof Error ? error.message : "Error desconocido",
          // });
        }
      }

      // 📤 Update: Completed
      stream.update({
        type: "complete",
        totalProcessed: files.length,
        successful,
        failed,
      });
    } catch (error) {
      console.error("Error fatal en procesamiento:", error);
    } finally {
      stream.done();
    }
  })();

  return { stream: stream.value };
}
