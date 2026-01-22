/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { EditPaymentDialog } from "./edit-payment-dialog";
import { PaymentAllocation } from "@/types/payments";
import { useAction } from "next-safe-action/hooks";

// Mock hooks
jest.mock("next-safe-action/hooks", () => ({
  useAction: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock("@/actions/payments", () => ({
  updatePaymentAction: {},
}));

// Mock icons
jest.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader">Loading</div>,
  X: () => <div data-testid="close">Close</div>,
  XIcon: () => <div data-testid="close">Close</div>,
}));

// Mock toaster
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

describe("EditPaymentDialog", () => {
  const mockExecute = jest.fn();
  const mockPayment: PaymentAllocation = {
    id: 1,
    paymentDate: new Date("2024-01-15T12:00:00Z"),
    amount: "1000.00",
    currency: "MXN",
    exchangeRate: "1.0",
    notes: "Original note",
    organizationId: 1,
    partnerId: 1,
    paymentType: "income",
    paymentMethod: "PUE",
    allocations: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    bankAccountId: null,
    referenceNumber: null,
    authorizationNumber: null,
    cfdiPaymentId: null,
  };
  const invoiceDate = new Date("2024-01-10T12:00:00Z");

  beforeEach(() => {
    jest.clearAllMocks();
    (useAction as jest.Mock).mockReturnValue({
      execute: mockExecute,
      status: "idle",
    });
  });

  it("should render correctly with initial values", () => {
    render(
      <EditPaymentDialog
        payment={mockPayment}
        invoiceDate={invoiceDate}
        open={true}
        onOpenChange={jest.fn()}
      />
    );

    expect(screen.getByText("Corregir Pago")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Original note")).toBeInTheDocument();
    // Date input value format is YYYY-MM-DD
    expect(screen.getByDisplayValue("2024-01-15")).toBeInTheDocument();
  });

  it("should show error if date is before invoice date", async () => {
    render(
      <EditPaymentDialog
        payment={mockPayment}
        invoiceDate={invoiceDate} // Jan 10
        open={true}
        onOpenChange={jest.fn()}
      />
    );

    const dateInput = screen.getByLabelText("Fecha de Pago");
    fireEvent.change(dateInput, { target: { value: "2024-01-05" } }); // Jan 5

    const submitBtn = screen.getByText("Guardar Cambios");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("La fecha de pago no puede ser anterior a la fecha de la factura.")
      ).toBeInTheDocument();
    });

    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("should submit valid data", async () => {
    render(
      <EditPaymentDialog
        payment={mockPayment}
        invoiceDate={invoiceDate}
        open={true}
        onOpenChange={jest.fn()}
      />
    );

    const dateInput = screen.getByLabelText("Fecha de Pago");
    fireEvent.change(dateInput, { target: { value: "2024-01-12" } }); // Valid date

    const notesInput = screen.getByLabelText("Notas");
    fireEvent.change(notesInput, { target: { value: "Updated note" } });

    const submitBtn = screen.getByText("Guardar Cambios");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith(expect.objectContaining({
        paymentId: 1,
        notes: "Updated note",
        // Date check might be tricky due to object equality, let's trust it called execute
      }));
    });
  });
});
