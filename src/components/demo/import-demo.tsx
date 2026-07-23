"use client";

import { CheckCircle, FileText } from "lucide-react";
import { UploadItem, type InvoiceState } from "@/components/upload-item";
import CFDIUploader from "@/components/file-upload";
import SummaryCards from "@/components/dashboard/summary-cards";
import { InvoicesList } from "@/components/invoices/invoices-list";
import type { DashboardMetrics } from "@/types/dashboard";

const mockUploads: InvoiceState[] = [
  {
    id: "mock-1",
    fileName: "factura_ingreso_SERVI01A.xml",
    status: "success",
    progress: 100,
  },
  {
    id: "mock-2",
    fileName: "factura_gasto_PAPEL02B.xml",
    status: "success",
    progress: 100,
  },
  {
    id: "mock-3",
    fileName: "factura_servicio_DUPL03C.xml",
    status: "invalid",
    progress: 100,
    error: "UUID duplicado \u2014 esta factura ya fue registrada previamente.",
  },
];

const mockMetrics: DashboardMetrics = {
  income: 45230.5,
  expenses: 15600,
  nextDeclarationDate: new Date("2026-07-17"),
};

function buildMockInvoice(
  id: number,
  overrides: Record<string, unknown>,
) {
  return {
    id,
    organizationId: 1,
    partnerId: id,
    invoiceType: "income",
    cfdiType: "I",
    cfdiVersion: "4.0",
    folioFiscal: "00000000-0000-0000-0000-000000000000",
    internalFolio: `FAC-${String(id).padStart(3, "0")}`,
    series: "FAC",
    invoiceDate: new Date(),
    certificationDate: new Date(),
    paymentDueDate: "2026-08-01",
    currency: "MXN",
    exchangeRate: "1.000000",
    subtotal: "10000.00",
    discount: "0",
    totalTaxes: "1600.00",
    totalWithholdings: "0",
    total: "11600.00",
    paymentMethod: "PPD",
    paymentForm: "03",
    paymentStatus: "paid",
    amountPaid: "11600.00",
    taxRegimeIssuer: "601",
    taxRegimeReceiver: "608",
    cfdiUse: "G03",
    xmlContent: null,
    pdfUrl: null,
    originalFileName: null,
    fileHash: null,
    processingStatus: "pending",
    extractionConfidence: null,
    aiClassification: null,
    validationErrors: null,
    accountId: null,
    costCenter: null,
    department: null,
    classificationSource: "ai",
    classificationConfindence: null,
    accountingPeriod: null,
    isReconciled: false,
    reconciliationDate: null,
    status: "active",
    cancellationReason: null,
    cancellationDate: null,
    substituteInvoiceId: null,
    notes: null,
    tags: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const mockInvoices = [
  buildMockInvoice(1, {
    invoiceType: "income",
    internalFolio: "SERVI-001",
    subtotal: "30000.00",
    total: "34800.00",
    amountPaid: "34800.00",
    paymentStatus: "paid",
  }),
  buildMockInvoice(2, {
    invoiceType: "income",
    internalFolio: "SERVI-002",
    subtotal: "9000.00",
    total: "10430.50",
    amountPaid: "10430.50",
    paymentStatus: "paid",
  }),
  buildMockInvoice(3, {
    invoiceType: "expense",
    cfdiType: "E",
    internalFolio: "PAPEL-001",
    subtotal: "11034.48",
    total: "12800.00",
    amountPaid: "12800.00",
    paymentStatus: "paid",
    paymentMethod: "PUE",
    paymentForm: "04",
  }),
  buildMockInvoice(4, {
    invoiceType: "expense",
    cfdiType: "E",
    internalFolio: "OFICI-001",
    subtotal: "4827.59",
    total: "5600.00",
    amountPaid: "2800.00",
    paymentStatus: "partial",
    paymentMethod: "PPD",
    paymentForm: "03",
  }),
];

const partners = [
  {
    id: 1,
    organizationId: 1,
    legalName: "Servicios Profesionales Integrales S.A. de C.V.",
    rfc: "SPI010101XXX",
    taxRegime: "601",
    email: "contacto@serviciospro.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    organizationId: 1,
    legalName: "Comercializadora Tecnológica S. de R.L. de C.V.",
    rfc: "CTE020202XXX",
    taxRegime: "601",
    email: "facturacion@comercializadoratech.mx",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    organizationId: 1,
    legalName: "Papelería y Oficina S.A. de C.V.",
    rfc: "POS030303XXX",
    taxRegime: "601",
    email: "ventas@papeleriayoficina.mx",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 4,
    organizationId: 1,
    legalName: "Muebles Metálicos del Centro S.A.",
    rfc: "MMC040404XXX",
    taxRegime: "601",
    email: "facturacion@mueblesmetalicos.mx",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockInvoicesWithPartner = mockInvoices.map((inv, i) => ({
  ...inv,
  businessPartner: partners[i],
  allocations: [
    {
      id: i + 1,
      invoiceId: inv.id,
      paymentId: i + 1,
      amountAllocated: inv.amountPaid,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  linkedPayments: [],
}));

export default function ImportDemo() {
  const monthName = new Date().toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoicesProp = mockInvoices as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoicesListProp = mockInvoicesWithPartner as any;

  return (
    <div className="space-y-16">
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-light tracking-tight">
            Resumen de {monthName}
          </h2>
        </div>
        <SummaryCards
          monthName={monthName}
          invoices={invoicesProp}
          metrics={mockMetrics}
          isLoading={false}
        />
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
          <h2 className="text-3xl font-light tracking-tight">
            Resultado de Importación
          </h2>
        </div>

        <CFDIUploader />

        <div className="flex items-center gap-2">
          <CheckCircle className="size-4 text-green-600" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Proceso Completado
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          2 facturas procesadas, 1 con errores.
        </p>
        <div className="divide-y">
          {mockUploads.map((upload) => (
            <UploadItem key={upload.id} upload={upload} />
          ))}
        </div>
      </section>

      <InvoicesList invoices={invoicesListProp} />
    </div>
  );
}
