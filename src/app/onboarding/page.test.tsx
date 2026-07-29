/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import OnboardingPage from "./page";
import { getTaxRegimes } from "@/data/taxRegimes";
import { getOrganizations } from "@/data/organizations";

// Mock the data access layers
jest.mock("@/data/taxRegimes", () => ({
  getTaxRegimes: jest.fn(),
}));

jest.mock("@/data/organizations", () => ({
  getOrganizations: jest.fn(),
}));

// Mock the ClientWrapper to isolate Page component tests
jest.mock("./_components/client-wrapper", () => ({
  OnboardingClientWrapper: ({
    organizations,
    regimes,
  }: {
    organizations: any[];
    regimes: any[];
  }) => (
    <div data-testid="client-wrapper">
      <span>Orgs Count: {organizations.length}</span>
      <span>Regimes Count: {regimes.length}</span>
    </div>
  ),
}));

describe("OnboardingPage Server Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch regimes and organizations and pass them to the client wrapper", async () => {
    const mockRegimes = [{ id: 1, code: "601", description: "General" }];
    const mockOrgs = [{ id: 10, businessName: "Acme" }];
    (getTaxRegimes as jest.Mock).mockResolvedValue(mockRegimes);
    (getOrganizations as jest.Mock).mockResolvedValue(mockOrgs);

    render(await OnboardingPage());

    expect(getTaxRegimes).toHaveBeenCalledTimes(1);
    expect(getOrganizations).toHaveBeenCalledTimes(1);

    const wrapper = screen.getByTestId("client-wrapper");
    expect(wrapper).toBeInTheDocument();
    expect(screen.getByText("Orgs Count: 1")).toBeInTheDocument();
    expect(screen.getByText("Regimes Count: 1")).toBeInTheDocument();
  });
});
