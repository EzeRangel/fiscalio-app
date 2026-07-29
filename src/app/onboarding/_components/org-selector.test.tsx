/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { OrgSelector } from "./org-selector";
import { useAction } from "next-safe-action/hooks";

jest.mock("next-safe-action/hooks", () => ({
  useAction: jest.fn(),
}));

const mockReplace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock("@/actions/session", () => ({
  setActiveOrganization: {},
}));

jest.mock("@/components/privacy-blur", () => ({
  PrivacyBlur: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="privacy-blur">{children}</span>
  ),
}));

describe("OrgSelector Component", () => {
  const mockExecute = jest.fn();
  const mockSwitchToForm = jest.fn();
  const mockOrgs = [
    { id: 1, businessName: "Acme Corp", rfc: "ACM123456XYZ", taxRegimeId: 601 } as any,
    { id: 2, businessName: "Globex", rfc: "GBX654321ABC", taxRegimeId: 625 } as any,
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAction as jest.Mock).mockReturnValue({
      execute: mockExecute,
      status: "idle",
    });
  });

  it("should render list of organizations and a create button", () => {
    render(
      <OrgSelector
        organizations={mockOrgs}
        onSwitchToForm={mockSwitchToForm}
      />
    );

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("ACM123456XYZ")).toBeInTheDocument();
    expect(screen.getByText("Globex")).toBeInTheDocument();
    expect(screen.getByText("GBX654321ABC")).toBeInTheDocument();
    expect(screen.getByText("Crear nueva organización")).toBeInTheDocument();
  });

  it("should call onSwitchToForm when clicking 'Crear nueva organización'", () => {
    render(
      <OrgSelector
        organizations={mockOrgs}
        onSwitchToForm={mockSwitchToForm}
      />
    );

    const createBtn = screen.getByText("Crear nueva organización");
    fireEvent.click(createBtn);

    expect(mockSwitchToForm).toHaveBeenCalledTimes(1);
  });

  it("should call setActiveOrganization when clicking an organization card", () => {
    render(
      <OrgSelector
        organizations={mockOrgs}
        onSwitchToForm={mockSwitchToForm}
      />
    );

    const firstOrgCard = screen.getByText("Acme Corp").closest("button");
    expect(firstOrgCard).toBeInTheDocument();
    fireEvent.click(firstOrgCard!);

    expect(mockExecute).toHaveBeenCalledWith({ organizationId: 1 });
  });
});
