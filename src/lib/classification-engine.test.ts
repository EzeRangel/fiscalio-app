
import { ClassificationEngine, EngineInvoice } from "./classification-engine";
import { Rule } from "@/types/classification-rules";

const mockInvoice: EngineInvoice = {
  cfdiType: "I",
  currency: "MXN",
  paymentForm: "03",
  partnerId: 1,
  partnerRfc: "ABC123456XYZ",
  items: [
    { productServiceKey: "80101500" }, // Servicios Profesionales
    { productServiceKey: "15101514" }, // Combustible
  ],
  taxes: [{ rate: 0.16 }, { rate: 0 }],
};

const mockRules: Rule[] = [
  {
    id: 1,
    organizationId: 1,
    ruleName: "CFDI de Ingreso",
    ruleType: "cfdi-type",
    matchCriteria: { ruleType: "cfdi-type", cfdiType: "I" },
    accountCode: '4000', // Ventas
    priority: 40,
    confidenceBoost: "0.30",
    timesApplied: 0,
    timesAccepted: 0,
    timesRejected: 0,
    accuracyRate: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    costCenter: null,
    department: null,
    tags: null,
  },
  {
    id: 2,
    organizationId: 1,
    ruleName: "Combustibles y Lubricantes",
    ruleType: "product-service",
    matchCriteria: {
      ruleType: "product-service",
      productServiceKeys: ["15101500", "15101505", "15101514", "15101515"],
    },
    accountCode: "5100", // Gastos de viaje
    priority: 75,
    confidenceBoost: "0.45",
    timesApplied: 0,
    timesAccepted: 0,
    timesRejected: 0,
    accuracyRate: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    costCenter: null,
    department: null,
    tags: null,
  },
  {
    id: 3,
    organizationId: 1,
    ruleName: "Pago con Transferencia",
    ruleType: "payment-form",
    matchCriteria: { ruleType: "payment-form", paymentForms: ["03"] },
    accountCode: '4000', // Ventas
    priority: 30,
    confidenceBoost: "0.15",
    timesApplied: 0,
    timesAccepted: 0,
    timesRejected: 0,
    accuracyRate: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    costCenter: null,
    department: null,
    tags: null,
  },
  {
    id: 4,
    organizationId: 1,
    ruleName: "Factura con IVA 0%",
    ruleType: "tax",
    matchCriteria: { ruleType: "tax", taxRate: 0 },
    accountCode: null, // No account code, should not generate a candidate
    priority: 40,
    confidenceBoost: "0.4",
    timesApplied: 0,
    timesAccepted: 0,
    timesRejected: 0,
    accuracyRate: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    costCenter: null,
    department: null,
    tags: null,
  },
    {
    id: 5,
    organizationId: 1,
    ruleName: "Rule that does not match",
    ruleType: "currency",
    matchCriteria: { ruleType: "currency", currency: ["USD"] },
    accountCode: '9999',
    priority: 40,
    confidenceBoost: "0.9",
    timesApplied: 0,
    timesAccepted: 0,
    timesRejected: 0,
    accuracyRate: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    costCenter: null,
    department: null,
    tags: null,
  },
];

describe("ClassificationEngine", () => {
  let engine: ClassificationEngine;

  beforeEach(() => {
    engine = new ClassificationEngine();
  });

  it("should generate candidates for matching rules", () => {
    const candidates = engine.run(mockInvoice, mockRules);
    expect(candidates).toHaveLength(2);
  });

  it("should group evidence for the same account code", () => {
    const candidates = engine.run(mockInvoice, mockRules);
    const salesCandidate = candidates.find(c => c.accountCode === '4000');
    expect(salesCandidate).toBeDefined();
    expect(salesCandidate?.evidence).toHaveLength(2);
    expect(salesCandidate?.evidence.map(e => e.ruleName)).toEqual(
      expect.arrayContaining(["CFDI de Ingreso", "Pago con Transferencia"])
    );
  });
  
  it("should calculate score based on new formula", () => {
    const candidates = engine.run(mockInvoice, mockRules);
    const salesCandidate = candidates.find(c => c.accountCode === '4000');
    // CFDI de Ingreso: (40/100) * 0.30 * 1 = 0.12
    // Pago con Transferencia: (30/100) * 0.15 * 0.5 = 0.0225
    // Total for 4000: 0.12 + 0.0225 = 0.1425
    expect(salesCandidate?.score).toBeCloseTo(0.1425);
    
    const travelCandidate = candidates.find(c => c.accountCode === '5100');
    // Combustibles y Lubricantes: (75/100) * 0.45 * (1/4) = 0.084375
    // Invoice has 1 of the 4 keys in the rule.
    expect(travelCandidate?.score).toBeCloseTo(0.084375);
  });

  it("should sort candidates by score in descending order", () => {
    const candidates = engine.run(mockInvoice, mockRules);
    expect(candidates[0].accountCode).toBe("4000"); // Score: 0.1425
    expect(candidates[1].accountCode).toBe("5100"); // Score: 0.084375
  });
  
  it("should not generate candidates for rules with no account code", () => {
    const candidates = engine.run(mockInvoice, mockRules);
    const nullAccountCodeRule = mockRules.find(r => r.ruleName === "Factura con IVA 0%");
    
    // Check that no candidate was created for this rule.
    const hasCandidate = candidates.some(c => 
        c.evidence.some(e => e.ruleName === nullAccountCodeRule?.ruleName)
    );
    expect(hasCandidate).toBe(false);
  });

  it("should not generate candidates for rules that do not match", () => {
    const candidates = engine.run(mockInvoice, mockRules);
    const nonMatchingRule = mockRules.find(r => r.ruleName === "Rule that does not match");
    
    const hasCandidate = candidates.some(c => 
        c.evidence.some(e => e.ruleName === nonMatchingRule?.ruleName)
    );
    expect(hasCandidate).toBe(false);
  });

});
