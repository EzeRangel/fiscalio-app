import { FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganizationCard } from "@/components/organizations/organization-card";
import { getOrganizations } from "@/data/organizations";
import { getTaxRegimes } from "@/data/taxRegimes";
import { BusinessPartnersCard } from "@/components/business-partners/business-partners-card";
import { getBusinessPartners } from "@/data/businessPartners";
import { CFDIUploader } from "@/components/cfdi-uploader";

const getData = async () => {
  const [regimes, organizations] = await Promise.all([
    getTaxRegimes(),
    getOrganizations(),
  ]);

  const contacts = await getBusinessPartners(organizations?.[0].id);

  return {
    regimes,
    contacts,
    organizations,
  };
};

export default async function Home() {
  const { regimes, organizations, contacts } = await getData();
  const organization = organizations?.[0] ?? undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Factura Inteligente
                </h1>
                <p className="text-sm text-gray-500">
                  Procesamiento offline con IA
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </Button>
          </div>
        </div>
      </header>
      <div className="container p-4 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <OrganizationCard regimes={regimes} organization={organization} />
          <div className="lg:col-span-2">
            <BusinessPartnersCard
              regimes={regimes}
              contacts={contacts}
              organization={organization}
            />
          </div>
          <div className="lg:col-span-3">
            <CFDIUploader organization={organization} />
          </div>
        </div>
      </div>
    </div>
  );
}
