/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import TaxDeclarationsPage from "../page";
import { getTaxDeclarationsDashboardData } from "@/data/tax-declarations";
import { getActiveOrganizationId } from "@/lib/session";

// Mock dependencies
jest.mock("@/data/tax-declarations", () => ({
  getTaxDeclarationsDashboardData: jest.fn(),
}));

jest.mock("@/lib/session", () => ({
  getActiveOrganizationId: jest.fn(),
}));

// Mock child components that might complicate layout tests or require context
jest.mock("../_components/summary-cards", () => ({
  SummaryCards: () => <div data-testid="summary-cards" />,
}));
jest.mock("../_components/generate-draft-button", () => ({
  GenerateDraftButton: () => <div data-testid="generate-draft-button" />,
}));
jest.mock("@/components/privacy-blur", () => ({
  PrivacyBlur: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("TaxDeclarationsPage UI Tests", () => {
  const mockCurrentPeriod = {
    period: "2026-06",
    declaration: null,
    totalIncome: 10000,
    totalExpenses: 5000,
    netAmount: 5000,
    incomeInvoiceCount: 5,
    expenseInvoiceCount: 3,
    estimatedTax: 150,
    ivaBalance: 800,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getActiveOrganizationId as jest.Mock).mockResolvedValue(1);
  });

  it("should render empty state when no history exists", async () => {
    (getTaxDeclarationsDashboardData as jest.Mock).mockResolvedValue({
      currentPeriod: mockCurrentPeriod,
      history: [],
    });

    render(await TaxDeclarationsPage());

    expect(screen.getByText("No hay estimaciones en el historial")).toBeInTheDocument();
  });

  it("should render history items for different statuses", async () => {
    const mockHistory = [
      {
        id: 1,
        fiscalPeriod: "2026-05",
        status: "filed",
        filedAt: "2026-06-15T12:00:00Z",
      },
      {
        id: 2,
        fiscalPeriod: "2026-04",
        status: "validated",
        updatedAt: "2026-05-10T12:00:00Z",
      },
      {
        id: 3,
        fiscalPeriod: "2026-03",
        status: "exported",
        exportedAt: "2026-04-12T12:00:00Z",
      },
      {
        id: 4,
        fiscalPeriod: "2026-02",
        status: "draft",
        updatedAt: "2026-03-08T12:00:00Z",
      },
    ];

    (getTaxDeclarationsDashboardData as jest.Mock).mockResolvedValue({
      currentPeriod: mockCurrentPeriod,
      history: mockHistory,
    });

    render(await TaxDeclarationsPage());

    // Verify periods render correctly (exact lowercase match in Spanish locale)
    expect(screen.getByText("mayo 2026")).toBeInTheDocument();
    expect(screen.getByText("abril 2026")).toBeInTheDocument();
    expect(screen.getByText("marzo 2026")).toBeInTheDocument();
    expect(screen.getByText("febrero 2026")).toBeInTheDocument();

    // Verify statuses render correctly as badges
    expect(screen.getByText("Finalizada")).toBeInTheDocument();
    expect(screen.getByText("Verificada")).toBeInTheDocument();
    expect(screen.getByText("Exportada")).toBeInTheDocument();
    expect(screen.getByText("Borrador")).toBeInTheDocument();

    // Verify secondary text formats correctly (encapsulated in getHistoryItemSecondaryText)
    expect(screen.getByText(/Presentada el 15 de junio 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Verificada el 10 de mayo 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Exportada el 12 de abril 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Última edición el 8 de marzo 2026/i)).toBeInTheDocument();
  });
});
