/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LinkPaymentComplementDialog } from "@/app/invoices/_components/link-payment-complement-dialog";
import { useQuery } from "@tanstack/react-query";
import { useAction } from "next-safe-action/hooks";

// Mock hooks
jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("next-safe-action/hooks", () => ({
  useAction: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock("@/actions/payments", () => ({
  getUnlinkedPaymentComplementsAction: {},
  linkPaymentAction: {},
}));

// Mock icons
jest.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader">Loading</div>,
  ArrowRightLeft: () => <div data-testid="link-icon">ArrowRightLeft</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  DollarSign: () => <div data-testid="dollar-icon">Dollar</div>,
  FileText: () => <div data-testid="file-icon">File</div>,
  XIcon: () => <div data-testid="x-icon">Close</div>,
}));

// Mock toaster
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

describe("LinkPaymentComplementDialog", () => {
  const mockExecute = jest.fn();
  const mockComplements = [
    {
      paymentId: 1,
      paymentInvoiceId: 10,
      partnerName: "Partner Inc",
      paymentDate: new Date("2024-01-15T12:00:00Z"),
      amount: "1000.00",
      uuid: "PAYMENT-UUID-123456",
      targetUuid: "TARGET-INVOICE-UUID",
      amountAllocated: "1000.00",
      resolvedDocsCount: 1,
      totalDocsCount: 3,
    },
    {
      paymentId: 2,
      paymentInvoiceId: 11,
      partnerName: "Another Corp",
      paymentDate: new Date("2024-01-20T12:00:00Z"),
      amount: "2500.00",
      uuid: "PAYMENT-UUID-789012",
      targetUuid: "TARGET-INVOICE-UUID",
      amountAllocated: "2500.00",
      resolvedDocsCount: 2,
      totalDocsCount: 3,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAction as jest.Mock).mockReturnValue({
      execute: mockExecute,
      status: "idle",
    });
  });

  it("should render loader when query is loading", () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
      refetch: jest.fn(),
    });

    render(
      <LinkPaymentComplementDialog
        invoiceId={100}
        open={true}
        onOpenChange={jest.fn()}
      />
    );

    expect(screen.getByText("Buscando complementos de pago...")).toBeInTheDocument();
  });

  it("should render empty state when there are no complements", () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: jest.fn(),
    });

    render(
      <LinkPaymentComplementDialog
        invoiceId={100}
        open={true}
        onOpenChange={jest.fn()}
      />
    );

    expect(
      screen.getByText("No se encontraron complementos pendientes de vincular")
    ).toBeInTheDocument();
  });

  it("should render list of complements correctly", () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: mockComplements,
      isLoading: false,
      refetch: jest.fn(),
    });

    render(
      <LinkPaymentComplementDialog
        invoiceId={100}
        open={true}
        onOpenChange={jest.fn()}
      />
    );

    expect(screen.getByText("Partner Inc")).toBeInTheDocument();
    expect(screen.getByText("Another Corp")).toBeInTheDocument();
    expect(screen.getAllByText("PAYMENT-...")).toHaveLength(2);
  });

  it("should filter complements list based on search query", () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: mockComplements,
      isLoading: false,
      refetch: jest.fn(),
    });

    render(
      <LinkPaymentComplementDialog
        invoiceId={100}
        open={true}
        onOpenChange={jest.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText("Buscar por cliente o proveedor...");
    fireEvent.change(searchInput, { target: { value: "Another" } });

    expect(screen.queryByText("Partner Inc")).not.toBeInTheDocument();
    expect(screen.getByText("Another Corp")).toBeInTheDocument();
  });

  it("should handle link confirmation and execution", async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: mockComplements,
      isLoading: false,
      refetch: jest.fn(),
    });

    render(
      <LinkPaymentComplementDialog
        invoiceId={100}
        open={true}
        onOpenChange={jest.fn()}
      />
    );

    // Click "Vincular" button for the first item
    const linkBtns = screen.getAllByText("Vincular");
    fireEvent.click(linkBtns[0]);

    // Button should change to "Confirmar" and show "Cancelar"
    expect(screen.getByText("Confirmar")).toBeInTheDocument();
    const cancelBtn = screen.getByText("Cancelar");
    expect(cancelBtn).toBeInTheDocument();

    // Click "Confirmar"
    const confirmBtn = screen.getByText("Confirmar");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith({
        paymentId: 1,
        paymentInvoiceId: 10,
        invoiceId: 100,
      });
    });
  });
});
