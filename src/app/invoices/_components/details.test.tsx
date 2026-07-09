/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { InvoiceDetails } from "./details";
import { InvoiceDetails as CFDI } from "@/types/invoices";

// Mock hooks and router
jest.mock("next-safe-action/hooks", () => ({
  useAction: jest.fn(() => ({ execute: jest.fn(), status: "idle" })),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

// Mock related components
jest.mock("@/components/privacy-blur", () => ({
  PrivacyBlur: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("./classification-feedback", () => ({
  ClassificationFeedback: () => <div data-testid="classification-feedback">Feedback</div>,
}));

jest.mock("./classification-assigned", () => ({
  __esModule: true,
  default: () => <div data-testid="classification-assigned">Assigned</div>,
}));

jest.mock("./edit-payment-dialog", () => ({
  EditPaymentDialog: () => <div data-testid="edit-payment-dialog">Edit Payment</div>,
}));

jest.mock("./cancel-invoice-dialog", () => ({
  CancelInvoiceDialog: () => <div data-testid="cancel-invoice-dialog">Cancel Invoice</div>,
}));

jest.mock("./register-refund-dialog", () => ({
  RegisterRefundDialog: () => <div data-testid="register-refund-dialog">Register Refund</div>,
}));

jest.mock("lucide-react", () => ({
  Calendar: () => <div data-testid="calendar">Calendar</div>,
  CreditCard: () => <div data-testid="credit-card">CreditCard</div>,
  Download: () => <div data-testid="download">Download</div>,
  FileText: () => <div data-testid="file-text">FileText</div>,
  Receipt: () => <div data-testid="receipt">Receipt</div>,
  User: () => <div data-testid="user">User</div>,
  ArrowRightLeft: () => <div data-testid="arrow-right-left">ArrowRightLeft</div>,
  AlertCircle: () => <div data-testid="alert-circle">AlertCircle</div>,
  Pencil: () => <div data-testid="pencil">Pencil</div>,
  X: () => <div data-testid="x">X</div>,
  XIcon: () => <div data-testid="x-icon">XIcon</div>,
  Undo: () => <div data-testid="undo">Undo</div>,
}));

const mockInvoice: CFDI = {
  id: 1,
  uuid: "uuid-123",
  folioFiscal: "folio-uuid-123",
  internalFolio: "F-101",
  invoiceDate: new Date("2024-01-10T12:00:00Z"),
  cfdiType: "I",
  invoiceType: "income",
  subTotal: "1000.00",
  discount: "0.00",
  total: "1160.00",
  currency: "MXN",
  exchangeRate: "1.0",
  status: "active",
  paymentStatus: "pending",
  paymentMethod: "PUE",
  paymentForm: "03",
  amountPaid: "0.00",
  taxRegime: "601",
  rfcEmisor: "AAA010101AAA",
  nombreEmisor: "Emisor Test",
  rfcReceptor: "ZZZ010101ZZZ",
  nombreReceptor: "Receptor Test",
  cfdiUse: "G03",
  xmlContent: "<xml/>",
  pdfPath: null,
  xmlPath: null,
  accountId: 10,
  organizationId: 1,
  partnerId: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [],
  allocations: [],
  linkedPayments: [],
  account: {
    id: 10,
    code: "601.01",
    name: "Ventas Gravadas",
    type: "income",
    subtype: "operating",
    classificationRules: [],
    organizationId: 1,
    parentId: null,
    level: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  businessPartner: {
    id: 5,
    rfc: "ZZZ010101ZZZ",
    legalName: "Receptor Test",
    partnerType: "customer",
    organizationId: 1,
    taxRegimeId: "601",
    street: null,
    exteriorNumber: null,
    interiorNumber: null,
    neighborhood: null,
    postalCode: "12345",
    locality: null,
    municipality: null,
    state: null,
    country: "MEX",
    email: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

describe("InvoiceDetails Component Integration", () => {
  it("should render active pending invoice details correctly", () => {
    render(<InvoiceDetails data={mockInvoice} relatedPayments={[]} />);

    expect(screen.getByText("Factura Digital")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByText("Cancelar Factura")).toBeInTheDocument();
  });

  it("should render cancelled badge when invoice is cancelled", () => {
    const cancelledInvoice = { ...mockInvoice, status: "cancelled" };
    render(<InvoiceDetails data={cancelledInvoice} relatedPayments={[]} />);

    expect(screen.getByText("Cancelada")).toBeInTheDocument();
    // Cancel button should not be rendered
    expect(screen.queryByText("Cancelar Factura")).not.toBeInTheDocument();
  });

  it("should render substituted badge when invoice is substituted", () => {
    const substitutedInvoice = { ...mockInvoice, status: "substituted" };
    render(<InvoiceDetails data={substitutedInvoice} relatedPayments={[]} />);

    expect(screen.getByText("Sustituida")).toBeInTheDocument();
    // Cancel button should not be rendered
    expect(screen.queryByText("Cancelar Factura")).not.toBeInTheDocument();
  });

  it("should render yellow warning banner when invoice is active and has paid amount", () => {
    const paidInvoice = { ...mockInvoice, amountPaid: "200.00" };
    render(<InvoiceDetails data={paidInvoice} relatedPayments={[]} />);

    expect(screen.getByText("Esta factura tiene pagos activos.")).toBeInTheDocument();
    expect(screen.getByText("Registrar Devolución")).toBeInTheDocument();
  });

  it("should render refund payments as 'Devolución' with Undo icon", () => {
    const refundPayment = {
      id: 99,
      paymentDate: new Date("2024-01-12T12:00:00Z"),
      amount: "200.00",
      currency: "MXN",
      exchangeRate: "1.0",
      notes: "Devolución registrada",
      organizationId: 1,
      partnerId: 5,
      paymentType: "refund",
      paymentMethod: "03",
      isRefund: true,
      allocations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      bankAccountId: null,
      referenceNumber: null,
      authorizationNumber: null,
      cfdiPaymentId: null,
    };

    render(<InvoiceDetails data={mockInvoice} relatedPayments={[refundPayment]} />);

    expect(screen.getByText("Devolución")).toBeInTheDocument();
    expect(screen.getByTestId("undo")).toBeInTheDocument();
  });
});
