"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Search, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Regime } from "@/types/taxRegimes";
import { Button } from "../ui/button";
import { BusinessPartnersDialogForm } from "./business-partners-dialog-form";
import { getBusinessPartnersByOrg } from "@/actions/business-partners";
import { PrivacyBlur } from "../privacy-blur";

interface Props {
  regimes: Regime[];
}

export function BusinessPartnersCard({ regimes }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data } = await getBusinessPartnersByOrg();

      if (!data) {
        throw new Error("Error al obtener Clientes/Proveedores");
      }

      return data;
    },
  });

  const clients = data?.filter((item) => item.partnerType === "client") ?? [];
  const providers =
    data?.filter((item) => item.partnerType === "provider") ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Clientes y Proveedores
            </CardTitle>
            <CardDescription>
              Gestiona tus contactos comerciales
            </CardDescription>
          </div>
          <BusinessPartnersDialogForm regimes={regimes} />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="clients">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="clients">
              Clientes ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="providers">
              Proveedores ({providers.length})
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o RFC..."
                // value={searchTerm}
                // onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <TabsContent value="clients" className="mt-0">
            {clients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No hay clientes registrados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {clients
                  // .filter(
                  //   (c) =>
                  //     c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  //     c.rfc.toLowerCase().includes(searchTerm.toLowerCase())
                  // )
                  .map((client) => (
                    <div
                      key={client.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {client.businessName}
                          </p>
                          <p className="text-sm text-gray-500">
                            RFC: <PrivacyBlur>{client.rfc}</PrivacyBlur>
                          </p>
                          {client.contact?.email && (
                            <p className="text-sm text-gray-600 mt-1">
                              {client.contact.email}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="providers" className="mt-0">
            {providers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No hay proveedores registrados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {providers
                  // .filter(
                  //   (p) =>
                  //     p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  //     p.rfc.toLowerCase().includes(searchTerm.toLowerCase())
                  // )
                  .map((provider) => (
                    <div
                      key={provider.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {provider.businessName}
                          </p>
                          <p className="text-sm text-gray-500">
                            RFC: <PrivacyBlur>{provider.rfc}</PrivacyBlur>
                          </p>
                          {provider.contact?.email && (
                            <p className="text-sm text-gray-600 mt-1">
                              {provider.contact?.email}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
