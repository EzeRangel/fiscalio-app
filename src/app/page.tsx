import { OrganizationCard } from "@/components/organizations/organization-card";
import { getOrganizations } from "@/data/organizations";
import { getTaxRegimes } from "@/data/taxRegimes";
import { BusinessPartnersCard } from "@/components/business-partners/business-partners-card";
import { CFDIUploader } from "@/components/cfdi-uploader";
import { InvoicesList } from "@/components/invoices/invoices-list";

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

export default async function Home() {
  const { regimes, organizations } = await getData();
  const organization = organizations?.[0] ?? undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container p-4 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <OrganizationCard regimes={regimes} organization={organization} />
          <div className="lg:col-span-2">
            <BusinessPartnersCard regimes={regimes} />
          </div>
          <div className="lg:col-span-3">
            <CFDIUploader organization={organization} />
          </div>
          <div className="lg:col-span-3">
            <InvoicesList />
          </div>
        </div>
      </div>
    </div>
  );
}
