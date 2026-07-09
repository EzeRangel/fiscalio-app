/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { RegisterRefundDialog } from "./register-refund-dialog";
import { useAction } from "next-safe-action/hooks";

jest.mock("next-safe-action/hooks", () => ({
  useAction: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock("@/actions/cancellation", () => ({
  registerRefundAction: {},
}));

jest.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader">Loading</div>,
  X: () => <div data-testid="close">Close</div>,
  XIcon: () => <div data-testid="close">Close</div>,
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

describe("RegisterRefundDialog", () => {
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
      <RegisterRefundDialog
        invoiceId={12}
        amountPaid="500.00"
        open={true}
        onOpenChange={jest.fn()}
      />
    );

    expect(screen.getByText("Registrar Devolución (Refund)")).toBeInTheDocument();
    expect(screen.getByDisplayValue("500.00")).toBeInTheDocument(); // Defaults to amountPaid
  });

  it("should fail validation if amount exceeds amountPaid", async () => {
    render(
      <RegisterRefundDialog
        invoiceId={12}
        amountPaid="500.00"
        open={true}
        onOpenChange={jest.fn()}
      />
    );

    const amountInput = screen.getByLabelText("Monto de la Devolución");
    fireEvent.change(amountInput, { target: { value: "600.00" } });

    const submitBtn = screen.getByText("Registrar Devolución");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("El monto del reembolso no puede exceder el total pagado ($500.00).")).toBeInTheDocument();
    });

    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("should successfully execute on valid submit", async () => {
    render(
      <RegisterRefundDialog
        invoiceId={12}
        amountPaid="500.00"
        open={true}
        onOpenChange={jest.fn()}
      />
    );

    const amountInput = screen.getByLabelText("Monto de la Devolución");
    fireEvent.change(amountInput, { target: { value: "250.00" } });

    const submitBtn = screen.getByText("Registrar Devolución");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith(expect.objectContaining({
        invoiceId: 12,
        amount: "250.00",
        paymentMethod: "03",
      }));
    });
  });
});
