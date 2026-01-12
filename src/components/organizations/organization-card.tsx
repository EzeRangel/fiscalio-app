"use client";

import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import OrganizationDialog from "./organization-dialog";
import { Button } from "../ui/button";
import { Organization } from "@/types/organizations";
import { Regime } from "@/types/taxRegimes";
import { PrivacyBlur } from "../privacy-blur";

interface Props {
  organization?: Organization;
  regimes: Regime[];
}

export function OrganizationCard({ organization: data, regimes }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Mi Organización
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">
                {data.legalName}
              </p>
              <p className="text-xs text-gray-500">
                RFC: <PrivacyBlur>{data.rfc}</PrivacyBlur>
              </p>
            </div>
            {data.contact?.email && (
              <p className="text-xs text-gray-600">{data.contact.email}</p>
            )}
            {data.contact?.phone && (
              <p className="text-xs text-gray-600">
                <PrivacyBlur>{data.contact.phone}</PrivacyBlur>
              </p>
            )}
            <Button variant="outline" size="sm" className="w-full">
              Editar
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-3">No configurada</p>
            <OrganizationDialog regimes={regimes} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
