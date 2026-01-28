export const CFDI_TYPE = {
  I: "Ingreso",
  E: "Egreso",
  T: "Traslado",
  P: "Pago",
};

export const INVOICE_TYPE = {
  income: "Ingreso",
  expense: "Egreso",
  transfer: "Traslado",
  payment: "Pago",
};

export const TAX_NAMES = {
  "001": "ISR",
  "002": "IVA",
  "003": "IEPS",
};

export const TAX_TYPES = {
  transferred: "Trasladado",
  withheld: "Retenido",
};

export const PAYMENT_FORMS = {
  "01": "Efectivo",
  "02": "Cheque",
  "03": "Transferencia",
  "04": "Tarjeta de crédito",
  "28": "Tarjeta de débito",
  "99": "Por definir",
};

export const CFDI_USES = {
  G01: "Adquisición de mercancías",
  G02: "Devoluciones, descuentos o bonificaciones",
  G03: "Gastos en general",
  I01: "Construcciones",
  I02: "Mobiliario y equipo de oficina",
  D01: "Honorarios médicos",
  P01: "Por definir",
};

export const PAYMENT_METHODS = {
  PUE: "Pago en una sola exhibición",
  PPD: "Pago en parcialidades o diferido",
};

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  asset: "Activo",
  liability: "Pasivo",
  equity: "Capital",
  income: "Ingreso",
  expense: "Gasto",
};

export const CHART_OF_ACCOUNTS_TEMPLATE = [
  {
    accountCode: "1000",
    accountName: "Activos",
    accountType: "asset" as const,
    level: 0,
  },
  {
    accountCode: "2000",
    accountName: "Pasivos",
    accountType: "liability" as const,
    level: 0,
  },
  {
    accountCode: "3000",
    accountName: "Capital",
    accountType: "equity" as const,
    level: 0,
  },
  {
    accountCode: "4000",
    accountName: "Ingresos",
    accountType: "income" as const,
    level: 0,
  },
  {
    accountCode: "5000",
    accountName: "Gastos",
    accountType: "expense" as const,
    level: 0,
  },
];

export const BASE_RULES = [
  {
    ruleName: "CFDI Nómina",
    ruleType: "cfdi-type",
    matchCriteria: { ruleType: "cfdi-type", cfdiType: "N" },
    accountCode: "5000", // Gastos
    priority: 70,
    confidenceBoost: "0.50",
  },
  {
    ruleName: "Combustibles y Lubricantes",
    ruleType: "product-service",
    matchCriteria: {
      ruleType: "product-service",
      productServiceKeys: ["15101500", "15101505", "15101514", "15101515"],
    },
    accountCode: "5000", // Gastos
    priority: 75,
    confidenceBoost: "0.45",
  },
  {
    ruleName: "Servicios Profesionales",
    ruleType: "product-service",
    matchCriteria: {
      ruleType: "product-service",
      productServiceKeys: ["80101500", "80111600"],
    },
    accountCode: "5000", // Gastos
    priority: 65,
    confidenceBoost: "0.40",
  },

  // --- Foundational / Signal Rules (with generic accounts) ---
  {
    ruleName: "CFDI de Ingreso",
    ruleType: "cfdi-type",
    matchCriteria: { ruleType: "cfdi-type", cfdiType: "I" },
    accountCode: null,
    priority: 40,
    confidenceBoost: "0.30",
  },
  {
    ruleName: "CFDI de Egreso",
    ruleType: "cfdi-type",
    matchCriteria: { ruleType: "cfdi-type", cfdiType: "E" },
    accountCode: null,
    priority: 70,
    confidenceBoost: "0.50",
  },
  {
    ruleName: "Transacción con RFC Extranjero",
    ruleType: "rfc",
    matchCriteria: { ruleType: "rfc", rfc: "XEXX010101000" },
    accountCode: null,
    priority: 50,
    confidenceBoost: "0.4",
  },
  {
    ruleName: "Factura con IVA 0%",
    ruleType: "tax",
    matchCriteria: { ruleType: "tax", taxRate: 0 },
    accountCode: null,
    priority: 40,
    confidenceBoost: "0.4",
  },
  {
    ruleName: "Moneda Extranjera (USD)",
    ruleType: "currency",
    matchCriteria: { ruleType: "currency", currency: ["USD", "EUR"] },
    accountCode: null,
    priority: 45,
    confidenceBoost: "0.30",
  },
  {
    ruleName: "Pago con Transferencia",
    ruleType: "payment-form",
    matchCriteria: { ruleType: "payment-form", paymentForms: ["03"] },
    accountCode: null,
    priority: 30,
    confidenceBoost: "0.15",
  },
  {
    ruleName: "Plantilla de Contacto/Proveedor",
    ruleType: "partner",
    matchCriteria: { ruleType: "partner", partnerIds: [] },
    accountCode: "5000", // Gastos
    priority: 50,
    confidenceBoost: "0.20",
  },
];

export const AUDIT_ENTITIES = {
  invoice: "Facturas",
  business_partner: "Socio Comercial",
  account: "Cuenta Contable",
  tax_declaration: "Estimación Fiscal",
  payment: "Pago",
};

export const AUDIT_ACTIONS = {
  created: "Creado",
  updated: "Actualizado",
  deleted: "Eliminado",
  classified: "Clasificado",
  reconciled: "Conciliado",
};

export const GENERIC_RFCS = {
  PUBLIC: "XAXX010101000",
  FOREIGN: "XEXX010101000",
};

export const GENERIC_RFC_LIST = [GENERIC_RFCS.PUBLIC, GENERIC_RFCS.FOREIGN];

export const CLASSIFICATION_LEARNING = {
  MIN_EVIDENCE_TO_PROMOTE: 5,
  MIN_CONSISTENCY_RATE: "0.8000",
  LEARNING_RATE: "0.1000",
};
