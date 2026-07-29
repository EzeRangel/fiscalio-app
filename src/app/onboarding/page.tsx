import { getTaxRegimes } from "@/data/taxRegimes";
import { getOrganizations } from "@/data/organizations";
import { OnboardingClientWrapper } from "./_components/client-wrapper";

const getData = async () => {
  const [regimes, organizations] = await Promise.all([
    getTaxRegimes(),
    getOrganizations(),
  ]);

  return {
    regimes,
    organizations,
  };
};

export default async function OnboardingPage() {
  const { regimes, organizations } = await getData();

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-muted/20 to-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-8">
        <OnboardingClientWrapper
          organizations={organizations}
          regimes={regimes}
        />
      </div>
    </div>
  );
}

