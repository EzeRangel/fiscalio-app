/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import InvoicesClient from "@/app/invoices/_components/invoices-client";

// Mock child components
jest.mock("@/app/invoices/_components/filters", () => {
  return function MockFilters({ 
    searchQuery, 
    onSearchChange, 
    cfdiTypeFilter, 
    onCfdiTypeChange 
  }: any) {
    return (
      <div data-testid="mock-filters">
        <input 
          data-testid="search-input" 
          value={searchQuery} 
          onChange={(e) => onSearchChange(e.target.value)} 
        />
        <select 
          data-testid="type-select" 
          value={cfdiTypeFilter} 
          onChange={(e) => onCfdiTypeChange(e.target.value)}
        >
          <option value="all">All</option>
          <option value="Ingreso">Ingreso</option>
          <option value="Egreso">Egreso</option>
        </select>
      </div>
    );
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

describe("InvoicesClient Filtering", () => {
  const mockInvoices = [
    {
      id: 1,
      internalFolio: "F1",
      total: "100.00",
      currency: "MXN",
      invoiceDate: "2024-01-01",
      cfdiType: "Ingreso",
      invoiceType: "income",
      businessPartner: { legalName: "Alpha Partner", rfc: "RFC1" },
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
      businessPartner: { legalName: "Beta Partner", rfc: "RFC2" },
      allocations: [],
    },
  ];

  it("should filter by search query (legalName)", () => {
    render(<InvoicesClient invoices={mockInvoices as any} />);

    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "Alpha" } });

    expect(screen.getByText("1 documento")).toBeInTheDocument();
    expect(screen.getByText("List: 1 invoices")).toBeInTheDocument();
  });

  it("should filter by search query (RFC)", () => {
    render(<InvoicesClient invoices={mockInvoices as any} />);

    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "RFC2" } });

    expect(screen.getByText("1 documento")).toBeInTheDocument();
    expect(screen.getByText("List: 1 invoices")).toBeInTheDocument();
  });

  it("should filter by search query (Folio)", () => {
    render(<InvoicesClient invoices={mockInvoices as any} />);

    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "F1" } });

    expect(screen.getByText("1 documento")).toBeInTheDocument();
    expect(screen.getByText("List: 1 invoices")).toBeInTheDocument();
  });

  it("should filter by CFDI type", () => {
    render(<InvoicesClient invoices={mockInvoices as any} />);

    const typeSelect = screen.getByTestId("type-select");
    fireEvent.change(typeSelect, { target: { value: "Egreso" } });

    expect(screen.getByText("1 documento")).toBeInTheDocument();
    expect(screen.getByText("List: 1 invoices")).toBeInTheDocument();
  });

  it("should show empty list when no matches", () => {
    render(<InvoicesClient invoices={mockInvoices as any} />);

    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "NonExistent" } });

    expect(screen.getByText("0 documentos")).toBeInTheDocument();
    expect(screen.getByText("List: 0 invoices")).toBeInTheDocument();
  });
});
