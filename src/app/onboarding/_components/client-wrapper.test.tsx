/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { OnboardingClientWrapper } from "./client-wrapper";

// Mock children to verify wrapper behavior
jest.mock("./org-selector", () => ({
  OrgSelector: ({
    organizations,
    onSwitchToForm,
  }: {
    organizations: any[];
    onSwitchToForm: () => void;
  }) => (
    <div data-testid="org-selector">
      <span>Orgs: {organizations.map((o) => o.businessName).join(", ")}</span>
      <button onClick={onSwitchToForm}>Create Org Link</button>
    </div>
  ),
}));

jest.mock("./form", () => ({
  OnboardingForm: ({ regimes }: { regimes: any[] }) => (
    <div data-testid="onboarding-form">
      <span>Regimes: {regimes.map((r) => r.description).join(", ")}</span>
    </div>
  ),
}));

// Mock logo image
jest.mock("../../../../public/logo.png", () => ({
  src: "/logo.png",
  height: 64,
  width: 64,
  blurDataURL: "",
}));

describe("OnboardingClientWrapper", () => {
  const mockRegimes = [{ id: 1, code: "601", description: "General" }];
  const mockOrgs = [
    { id: 10, businessName: "Acme", rfc: "ACM123", taxRegimeId: 1 } as any,
  ];

  it("should show OnboardingForm directly if no organizations exist", () => {
    render(
      <OnboardingClientWrapper organizations={[]} regimes={mockRegimes} />
    );

    expect(screen.queryByTestId("org-selector")).not.toBeInTheDocument();
    expect(screen.getByTestId("onboarding-form")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Comencemos configurando tu organización. Solo tomará 30 segundos."
      )
    ).toBeInTheDocument();
  });

  it("should show OrgSelector initially if organizations exist", () => {
    render(
      <OnboardingClientWrapper
        organizations={mockOrgs}
        regimes={mockRegimes}
      />
    );

    expect(screen.getByTestId("org-selector")).toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-form")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Selecciona una organización para comenzar o crea una nueva."
      )
    ).toBeInTheDocument();
  });

  it("should toggle to OnboardingForm when clicking create new organization", () => {
    render(
      <OnboardingClientWrapper
        organizations={mockOrgs}
        regimes={mockRegimes}
      />
    );

    expect(screen.getByTestId("org-selector")).toBeInTheDocument();

    const switchBtn = screen.getByText("Create Org Link");
    fireEvent.click(switchBtn);

    expect(screen.queryByTestId("org-selector")).not.toBeInTheDocument();
    expect(screen.getByTestId("onboarding-form")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Comencemos configurando tu organización. Solo tomará 30 segundos."
      )
    ).toBeInTheDocument();
  });
});
