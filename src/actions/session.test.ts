import { setActiveOrganization } from "./session";
import { cookies } from "next/headers";

// Mock the safe-action client to avoid ESM issues in Jest
jest.mock("@/lib/safe-action", () => ({
  actionClient: {
    inputSchema: jest.fn().mockReturnThis(),
    action: jest.fn((fn) => fn),
  },
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

describe("Session Server Actions", () => {
  it("should set the activeOrganizationId cookie with 1-year maxAge", async () => {
    const mockCookies = {
      set: jest.fn(),
    };
    (cookies as jest.Mock).mockResolvedValue(mockCookies);

    // Call the action directly (which is now the inner function due to our mock)
    await (setActiveOrganization as any)({
      parsedInput: { organizationId: 42 },
    });

    expect(mockCookies.set).toHaveBeenCalledWith(
      "activeOrganizationId",
      "42",
      expect.objectContaining({
        httpOnly: true,
        secure: false, // process.env.NODE_ENV is test
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      })
    );
  });
});
