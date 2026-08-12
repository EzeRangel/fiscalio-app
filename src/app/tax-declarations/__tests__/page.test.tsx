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

    expect(screen.getByText("No hay declaraciones en el historial")).toBeInTheDocument();
  });

  it("should render history items and current period deadline", async () => {
    const mockHistory = [
      {
        id: 1,
        fiscalPeriod: "2026-05",
        status: "filed",
        filedAt: "2026-06-15T12:00:00Z",
      },
    ];

    (getTaxDeclarationsDashboardData as jest.Mock).mockResolvedValue({
      currentPeriod: mockCurrentPeriod,
      history: mockHistory,
    });

    render(await TaxDeclarationsPage());

    // Verify deadline renders correctly
    expect(screen.getByText("Límite para declarar: 17 de julio 2026")).toBeInTheDocument();

    // Verify periods render correctly (exact lowercase match in Spanish locale)
    expect(screen.getByText("mayo 2026")).toBeInTheDocument();

    // Verify secondary text formats correctly
    expect(screen.getByText(/Presentada el 15 de junio 2026/i)).toBeInTheDocument();
  });
});
