/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import InvoicesClient from "@/app/invoices/_components/invoices-client";

// Mock child components
jest.mock("@/app/invoices/_components/filters", () => {
  return function MockFilters() {
    return <div data-testid="mock-filters">Filters</div>;
  };
});

jest.mock("@/app/invoices/_components/list", () => {
  return function MockList({ invoices }: { invoices: any[] }) {
    return (
      <div data-testid="mock-list">
        List: {invoices.length} invoices
      </div>
    );
  };
});

// Mock PrivacyBlur
jest.mock("@/components/privacy-blur", () => ({
  PrivacyBlur: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("InvoicesClient", () => {
  const mockInvoices = [
    {
      id: 1,
      internalFolio: "F1",
      total: "100.00",
      currency: "MXN",
      invoiceDate: "2024-01-01",
      cfdiType: "Ingreso",
      invoiceType: "income",
      businessPartner: { legalName: "Partner 1", rfc: "P1" },
      allocations: [],
    },
    {
      id: 2,
      internalFolio: "F2",
      total: "200.00",
      currency: "MXN",
      invoiceDate: "2024-02-01",
      cfdiType: "Egreso",
      invoiceType: "expense",
      businessPartner: { legalName: "Partner 2", rfc: "P2" },
      allocations: [],
    },
  ];

  it("should render header with initial count and child components", () => {
    render(<InvoicesClient invoices={mockInvoices as any} />);

    expect(screen.getByText("Facturas")).toBeInTheDocument();
    expect(screen.getByText("2 documentos")).toBeInTheDocument();
    expect(screen.getByTestId("mock-filters")).toBeInTheDocument();
    expect(screen.getByTestId("mock-list")).toBeInTheDocument();
    expect(screen.getByText("List: 2 invoices")).toBeInTheDocument();
  });
});
