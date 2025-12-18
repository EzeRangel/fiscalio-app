"use client";

import { Upload } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { SubmitButton } from "./ui/submit-button";
import { useAction } from "next-safe-action/hooks";
import { saveInvoice } from "@/actions/invoices";
import { toast } from "sonner";
import { Organization } from "@/types/organizations";

interface Props {
  organization: Organization;
}

export function CFDIUploader({ organization }: Props) {
  const { execute } = useAction(saveInvoice, {
    onSuccess: () => {
      toast.success("CFDI procesado correctamente");
    },
    onError: (error) => {
      console.log(error);

      toast.error("Error al procesar CFDI");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Procesar Facturas</CardTitle>
        <CardDescription>
          Sube archivos XML para extraer y clasificar datos automáticamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={execute}>
          <input type="hidden" name="organizationId" value={organization.id} />
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-700 mb-1">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-gray-500">Soporta XML (CFDI).</p>
            <div className="space-y-3 mt-4">
              <Input name="cfdi" type="file" accept=".xml" />
              <SubmitButton>Enviar Archivo</SubmitButton>
            </div>
          </div>
          {/* <div className="mt-6 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Funciones de IA:
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Extracción automática de datos de facturas</li>
            <li>• Clasificación contable inteligente</li>
            <li>• Detección de inconsistencias y errores</li>
            <li>• Preparación automática para declaraciones SAT</li>
          </ul>
        </div> */}
        </form>
      </CardContent>
    </Card>
  );
}
