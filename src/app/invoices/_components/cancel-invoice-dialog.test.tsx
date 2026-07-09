/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CancelInvoiceDialog } from "./cancel-invoice-dialog";
import { useAction } from "next-safe-action/hooks";

jest.mock("next-safe-action/hooks", () => ({
  useAction: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock("@/actions/cancellation", () => ({
  cancelInvoiceAction: {},
}));

jest.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader">Loading</div>,
  X: () => <div data-testid="close">Close</div>,
  XIcon: () => <div data-testid="close">Close</div>,
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

describe("CancelInvoiceDialog", () => {
  const mockExecute = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAction as jest.Mock).mockReturnValue({
      execute: mockExecute,
      status: "idle",
    });
  });

  it("should render correctly", () => {
    render(
      <CancelInvoiceDialog
        invoiceId={12}
        open={true}
        onOpenChange={jest.fn()}
      />
    );

    expect(screen.getByText("Cancelar Factura ante el SAT")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument(); // Default selected radio's key label
  });

  it("should show substitute UUID input when motive 01 is selected", async () => {
    render(
      <CancelInvoiceDialog
        invoiceId={12}
        open={true}
        onOpenChange={jest.fn()}
      />
    );

    // Find and click Motivo 01 radio
    const motive01Label = screen.getByText("01");
    fireEvent.click(motive01Label);

    await waitFor(() => {
      expect(screen.getByLabelText("UUID de Factura Sustituta")).toBeInTheDocument();
    });
  });

  it("should fail to submit if confirm checkbox is not checked", async () => {
    render(
      <CancelInvoiceDialog
        invoiceId={12}
        open={true}
        onOpenChange={jest.fn()}
      />
    );

    const notesInput = screen.getByLabelText("Descripción del Motivo");
    fireEvent.change(notesInput, { target: { value: "Test cancellation reason" } });

    const submitBtn = screen.getByText("Confirmar Cancelación");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Debe confirmar que desea cancelar esta factura ante el SAT.")).toBeInTheDocument();
    });

    expect(mockExecute).not.toHaveBeenCalled();
  });
});
