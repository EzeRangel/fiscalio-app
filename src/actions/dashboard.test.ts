import { getDashboardMetricsAction } from "./dashboard";
import { getActiveOrganizationId } from "@/lib/session";
import { getDashboardMetrics } from "@/data/dashboard";

// Mock dependencies
jest.mock("@/data/dashboard");
jest.mock("@/lib/session");

// Mock safe-action to avoid ESM issues
jest.mock("@/lib/safe-action", () => ({
  actionClient: {
    inputSchema: jest.fn().mockReturnThis(),
    action: jest.fn((callback) => (input: any) => callback({ parsedInput: input })),
  },
}));

describe("getDashboardMetricsAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getActiveOrganizationId as jest.Mock).mockResolvedValue(1);
    (getDashboardMetrics as jest.Mock).mockResolvedValue({
      income: 1500,
      expenses: 500,
      nextDeclarationDate: new Date(2024, 1, 17),
    });
  });

  it("should return aggregates for the given period", async () => {
    const result = await getDashboardMetricsAction({ month: 0, year: 2024 });
    
    expect(getActiveOrganizationId).toHaveBeenCalled();
    expect(getDashboardMetrics).toHaveBeenCalledWith(1, { month: 0, year: 2024 });
    expect(result).toEqual({
      income: 1500,
      expenses: 500,
      nextDeclarationDate: expect.any(Date),
    });
  });
});
