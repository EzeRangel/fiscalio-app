import { AccountFormSchema } from "@/types/chart-of-accounts";

describe("AccountFormSchema", () => {
  const baseAccount = {
    accountCode: "101.01",
    accountName: "Caja Chica",
    accountType: "asset",
    isActive: true,
  };

  it("should validate a valid account with ivaAccreditationPercentage", () => {
    const validAccount = {
      ...baseAccount,
      ivaAccreditationPercentage: "50.00",
    };
    const result = AccountFormSchema.safeParse(validAccount);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ivaAccreditationPercentage).toBe("50.00");
    }
  });

  it("should default ivaAccreditationPercentage to 100.00 if not provided", () => {
    const result = AccountFormSchema.safeParse(baseAccount);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ivaAccreditationPercentage).toBe("100.00");
    }
  });
});
