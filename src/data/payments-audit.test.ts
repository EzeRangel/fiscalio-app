import { savePaymentComplement } from "./payments";
import { logAction } from "@/lib/audit-service";
import { invoices } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Mock dependencies
jest.mock("@/lib/audit-service");
jest.mock("@/db", () => ({
    payments: { id: { name: 'id' } },
    paymentAllocations: { id: { name: 'id' } },
    invoices: { 
        id: { name: 'id' }, 
        folioFiscal: { name: 'folio_fiscal' },
        organizationId: { name: 'organization_id' }
    },
}));

describe("Payments Audit", () => {
  const mockTx = {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnValue([{ id: 100 }]), // New Payment ID
    query: {
        invoices: {
            findFirst: jest.fn()
        }
    },
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should log audit when saving a payment complement", async () => {
    const parsedCFDI = {
        Complemento: [
            {
                TimbreFiscalDigital: { UUID: "UUID-PAYMENT" },
                Pagos: {
                    Pago: {
                        FechaPago: "2023-01-01T12:00:00",
                        FormaDePagoP: "01",
                        MonedaP: "MXN",
                        Monto: "500.00",
                        DoctoRelacionado: {
                             IdDocumento: "UUID-INVOICE",
                             ImpPagado: "500.00",
                             NumParcialidad: "1"
                        }
                    }
                }
            }
        ]
    };

    // Mock invoice finding
    mockTx.query.invoices.findFirst.mockResolvedValue({ 
        id: 50, 
        amountPaid: "0", 
        total: "500.00" 
    });

    await savePaymentComplement(
        mockTx,
        parsedCFDI as any,
        1, // Org ID
        2, // Partner ID
        "income"
    );

    expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: 1,
        entityType: "payment",
        entityId: 100,
        action: "created",
        metadata: {
            source: "import",
            reason: "Payment Complement Import",
            cfdiUuid: "UUID-PAYMENT"
        },
        tx: mockTx
    }));
  });
});
