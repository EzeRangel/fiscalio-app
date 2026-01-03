import {
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { relations } from "drizzle-orm";
import { declarationInvoices } from "./declarationInvoices";

export const taxDeclarations = pgTable(
  "tax_declarations",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Período fiscal
    fiscalPeriod: varchar("fiscal_period", { length: 7 }).notNull(), // 'YYYY-MM'
    declarationType: varchar("declaration_type", { length: 30 }).notNull(), // 'monthly', 'bimonthly', 'annual'
    taxRegime: varchar("tax_regime", { length: 10 }).notNull(), // Del catálogo SAT (612-RIF, 626-RESICO, etc.)

    // Estado de la declaración
    status: varchar("status", { length: 20 }).default("draft"), // 'draft', 'validated', 'exported', 'filed'

    // Totales calculados
    totalIncome: decimal("total_income", { precision: 15, scale: 2 }).notNull(),
    totalExpenses: decimal("total_expenses", {
      precision: 15,
      scale: 2,
    }).notNull(),
    deductibleExpenses: decimal("deductible_expenses", {
      precision: 15,
      scale: 2,
    }).notNull(),

    // IVA
    ivaCharged: decimal("iva_charged", { precision: 15, scale: 2 }).default(
      "0"
    ), // IVA cobrado
    ivaCreditable: decimal("iva_creditable", {
      precision: 15,
      scale: 2,
    }).default("0"), // IVA pagado deducible
    ivaBalance: decimal("iva_balance", { precision: 15, scale: 2 }).default(
      "0"
    ), // A favor o a cargo

    // ISR
    isrBase: decimal("isr_base", { precision: 15, scale: 2 }).default("0"), // Base gravable
    isrRate: decimal("isr_rate", { precision: 5, scale: 4 }), // Tasa aplicable
    isrCalculated: decimal("isr_calculated", {
      precision: 15,
      scale: 2,
    }).default("0"),
    isrWithheld: decimal("isr_withheld", { precision: 15, scale: 2 }).default(
      "0"
    ), // Retenciones sufridas
    isrProvisional: decimal("isr_provisional", {
      precision: 15,
      scale: 2,
    }).default("0"), // Pagos previos
    isrBalance: decimal("isr_balance", { precision: 15, scale: 2 }).default(
      "0"
    ),

    // Metadata de cálculo
    calculationDetails: jsonb("calculation_details"), // JSON con desglose detallado
    aiValidations: jsonb("ai_validations"), // Alertas generadas por IA

    // Exportación
    exportFormat: varchar("export_format", { length: 20 }), // 'sipred', 'declara_sat', 'txt'
    exportedFile: text("exported_file"), // Blob o path del archivo generado
    exportedAt: timestamp("exported_at"),

    // Presentación al SAT
    filedAt: timestamp("filed_at"),
    acknowledgmentNumber: varchar("acknowledgment_number", { length: 50 }), // Acuse del SAT

    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return {
      organizationIdIndex: index("idx_tax_declarations_org").on(
        table.organizationId
      ),
      fiscalPeriodIndex: index("idx_tax_declarations_period").on(
        table.fiscalPeriod
      ),
      statusIndex: index("idx_tax_declarations_status").on(table.status),
      // Constraint: Una sola declaración por período por organización
      uniquePeriod: unique("unique_org_period").on(
        table.organizationId,
        table.fiscalPeriod,
        table.declarationType
      ),
    };
  }
);

export const taxDeclarationsRelations = relations(
  taxDeclarations,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [taxDeclarations.organizationId],
      references: [organizations.id],
    }),
    declarationInvoices: many(declarationInvoices),
  })
);
