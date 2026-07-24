/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import List from "@/app/invoices/_components/list";

// Mock PrivacyBlur
jest.mock("@/components/privacy-blur", () => ({
  PrivacyBlur: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock icons
jest.mock("lucide-react", () => ({
  MoreHorizontal: () => <div data-testid="more-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  FileText: () => <div data-testid="file-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  Receipt: () => <div data-testid="receipt-icon" />,
}));

describe("List Component Grouping and Totals", () => {
  const mockInvoices = [
    {
      id: 1,
      internalFolio: "F1",
      total: "1000.00",
      currency: "MXN",
      invoiceDate: "2024-01-15",
      accountingPeriod: "2024-01",
      cfdiType: "I",
      invoiceType: "income",
      businessPartner: { legalName: "Partner A", rfc: "RFC1" },
      allocations: [{ amountAllocated: "1000.00" }],
    },
    {
      id: 2,
      internalFolio: "F2",
      total: "500.00",
      currency: "MXN",
      invoiceDate: "2024-01-20",
      accountingPeriod: "2024-01",
      cfdiType: "E",
      invoiceType: "expense",
      businessPartner: { legalName: "Partner B", rfc: "RFC2" },
      allocations: [{ amountAllocated: "500.00" }],
    },
    {
      id: 3,
      internalFolio: "F3",
      total: "2000.00",
      currency: "MXN",
      invoiceDate: "2024-02-10",
      accountingPeriod: "2024-02",
      cfdiType: "I",
      invoiceType: "income",
      businessPartner: { legalName: "Partner A", rfc: "RFC1" },
      allocations: [{ amountAllocated: "1000.00" }], // Partially paid
    },
    {
      id: 4,
      internalFolio: "F4",
      total: "300.00",
      currency: "MXN",
      invoiceDate: "2024-03-05",
      accountingPeriod: null, // Test fallback to invoiceDate
      cfdiType: "E",
      invoiceType: "expense",
      businessPartner: { legalName: "Partner C", rfc: "RFC3" },
      allocations: [{ amountAllocated: "300.00" }],
    },
  ];

  it("should render a flat list when periodGroup is 'none'", () => {
    render(<List invoices={mockInvoices as any} periodGroup="none" />);
    
    expect(screen.getByText("F1")).toBeInTheDocument();
    expect(screen.getByText("F2")).toBeInTheDocument();
    expect(screen.getByText("F3")).toBeInTheDocument();
    expect(screen.getByText("F4")).toBeInTheDocument();
  });

  it("should group by month and display totals", () => {
    render(<List invoices={mockInvoices as any} periodGroup="month" />);

    // Check month headers with flexible matchers and getAllByText
    expect(screen.getAllByText(/enero/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/febrero/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/marzo/i).length).toBeGreaterThanOrEqual(1);

    // In Jan: Income 1000, Expense 500
    // In Feb: Income 1000, Expense 0
    // In Mar: Income 0, Expense 300
    expect(screen.getAllByText("$1,000.00").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("$500.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("$300.00").length).toBeGreaterThanOrEqual(1);
  });

  it("should group by year and display totals", () => {
    render(<List invoices={mockInvoices as any} periodGroup="year" />);

    expect(screen.getAllByText("2024").length).toBeGreaterThanOrEqual(1);
    // Year total: Income (1000 + 1000) = 2000, Expense (500 + 300) = 800
    expect(screen.getAllByText("$2,000.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("$800.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("$1,200.00").length).toBeGreaterThanOrEqual(1); // Net
  });
});

describe("List Component - Payment Complements Expansion", () => {
  const mockParentInvoice = {
    id: 1,
    organizationId: 1,
    partnerId: 1,
    invoiceType: "income",
    cfdiType: "I",
    cfdiVersion: "4.0",
    folioFiscal: "parent-uuid",
    internalFolio: "A-100",
    series: "A",
    invoiceDate: new Date("2026-07-01T12:00:00Z"),
    certificationDate: new Date("2026-07-01T12:05:00Z"),
    paymentDueDate: "2026-07-31",
    currency: "MXN",
    exchangeRate: "1.000000",
    subtotal: "10000.00",
    discount: "0.00",
    totalTaxes: "1600.00",
    totalWithholdings: "0.00",
    total: "11600.00",
    paymentMethod: "PPD",
    paymentForm: "99",
    paymentStatus: "partial",
    amountPaid: "5000.00",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
    account: null,
    businessPartner: {
      id: 1,
      organizationId: 1,
      businessName: "Client Business Name",
      legalName: "Client Legal Name",
      rfc: "CLI990101XXX",
    },
    items: [],
    allocations: [
      {
        id: 10,
        paymentId: 100,
        invoiceId: 1,
        amountAllocated: "5000.00",
        exchangeRate: "1.000000",
        installmentNumber: 1,
        createdAt: new Date(),
        payment: {
          id: 100,
          organizationId: 1,
          partnerId: 1,
          paymentType: "payment_received",
          paymentDate: new Date("2026-07-05T12:00:00Z"),
          paymentMethod: "03",
          currency: "MXN",
          exchangeRate: "1.000000",
          amount: "5000.00",
          cfdiPaymentId: "complement-uuid",
          isRefund: false,
        },
      },
    ],
    linkedPayments: [],
  };

  const mockPaymentComplement = {
    id: 2,
    organizationId: 1,
    partnerId: 1,
    invoiceType: "payment_received",
    cfdiType: "P",
    cfdiVersion: "4.0",
    folioFiscal: "complement-uuid",
    internalFolio: "P-1",
    series: "P",
    invoiceDate: new Date("2026-07-05T12:00:00Z"),
    certificationDate: new Date("2026-07-05T12:05:00Z"),
    currency: "XXX",
    exchangeRate: "1.000000",
    subtotal: "0.00",
    discount: "0.00",
    totalTaxes: "0.00",
    totalWithholdings: "0.00",
    total: "5000.00",
    paymentStatus: "paid",
    amountPaid: "5000.00",
    status: "active",
    businessPartner: {
      id: 1,
      organizationId: 1,
      businessName: "Client Business Name",
      legalName: "Client Legal Name",
      rfc: "CLI990101XXX",
    },
    items: [],
    allocations: [],
    linkedPayments: [
      {
        id: 100,
        organizationId: 1,
        partnerId: 1,
        paymentType: "payment_received",
        paymentDate: new Date("2026-07-05T12:00:00Z"),
        paymentMethod: "03",
        currency: "MXN",
        exchangeRate: "1.000000",
        amount: "5000.00",
        cfdiPaymentId: "complement-uuid",
        isRefund: false,
        allocations: [
          {
            id: 10,
            paymentId: 100,
            invoiceId: 1,
            amountAllocated: "5000.00",
            exchangeRate: "1.000000",
            installmentNumber: 1,
          },
        ],
      },
    ],
  };

  it("renders the list and displays the expand toggle for invoices with complements", () => {
    render(
      <List
        invoices={[mockParentInvoice] as any}
        allInvoices={[mockParentInvoice, mockPaymentComplement] as any}
        periodGroup="none"
      />
    );

    // Parent details should render
    expect(screen.getByText("A-100")).toBeInTheDocument();

    // Toggle button should be visible
    expect(screen.getByTestId("chevron-right")).toBeInTheDocument();

    // Complement details should not render yet
    expect(screen.queryByText("P-1")).not.toBeInTheDocument();
    expect(screen.queryByText("complement-uuid")).not.toBeInTheDocument();
  });

  it("expands the row and shows complement details when clicking the toggle", () => {
    render(
      <List
        invoices={[mockParentInvoice] as any}
        allInvoices={[mockParentInvoice, mockPaymentComplement] as any}
        periodGroup="none"
      />
    );

    const toggle = screen.getByTestId("chevron-right");
    fireEvent.click(toggle);

    // Sub-row containing complement details should be visible
    expect(screen.getByText("P-1")).toBeInTheDocument();
    expect(screen.getByText("complement-uuid")).toBeInTheDocument();
    expect(screen.getByText("Parcialidad #1")).toBeInTheDocument();
    
    // Check amounts are rendered. (Using a matcher or exact text since they are in PrivacyBlur mockup which just renders children)
    expect(screen.getAllByText("$5,000.00").length).toBe(3);
  });

  it("does not render the expand toggle if there are no complements", () => {
    render(
      <List
        invoices={[mockParentInvoice] as any}
        allInvoices={[mockParentInvoice] as any}
        periodGroup="none"
      />
    );

    expect(screen.getByText("A-100")).toBeInTheDocument();
    expect(screen.queryByTestId("chevron-right")).not.toBeInTheDocument();
  });
});
