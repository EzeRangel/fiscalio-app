/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
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
  ];

  it("should render a flat list when periodGroup is 'none'", () => {
    render(<List invoices={mockInvoices as any} periodGroup="none" />);
    
    expect(screen.getByText("F1")).toBeInTheDocument();
    expect(screen.getByText("F2")).toBeInTheDocument();
    expect(screen.getByText("F3")).toBeInTheDocument();
  });

  it("should group by month and display totals", () => {
    render(<List invoices={mockInvoices as any} periodGroup="month" />);

    // Check month headers with flexible matchers and getAllByText
    expect(screen.getAllByText(/enero/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/febrero/i).length).toBeGreaterThanOrEqual(1);

    // In Jan: Income 1000, Expense 500
    // In Feb: Income 1000, Expense 0
    expect(screen.getAllByText("$1,000.00").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("$500.00").length).toBeGreaterThanOrEqual(1);
  });

  it("should group by year and display totals", () => {
    render(<List invoices={mockInvoices as any} periodGroup="year" />);

    expect(screen.getAllByText("2024").length).toBeGreaterThanOrEqual(1);
    // Year total: Income (1000 + 1000) = 2000, Expense 500
    expect(screen.getAllByText("$2,000.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("$500.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("$1,500.00").length).toBeGreaterThanOrEqual(1); // Net
  });
});
