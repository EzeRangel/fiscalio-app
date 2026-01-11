"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { saveBusinessPartner } from "@/actions/business-partners";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { SubmitButton } from "../ui/submit-button";
import { Textarea } from "../ui/textarea";
import { Regime } from "@/types/taxRegimes";

interface Props {
  regimes: Regime[];
}

export function BusinessPartnersDialogForm({ regimes = [] }: Props) {
  const [open, setOpen] = useState(false);

  const { execute } = useAction(saveBusinessPartner, {
    onSuccess: () => {
      toast.success("Contacto guardado exitosamente!");
      setOpen(false);
    },
    onError: ({ error: { validationErrors, serverError } }) => {
      if (serverError) {
        toast.error(serverError);
      } else if (validationErrors) {
        console.log(validationErrors);
        toast.info("Por favor corrige los errores en el formulario");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 shadow-lg">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Socio
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-162.5 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Socio</DialogTitle>
          <DialogDescription>
            Ingresa los datos del cliente o proveedor
          </DialogDescription>
        </DialogHeader>
        <form action={execute} className="space-y-4">
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Nombre o Razón Social</Label>
                <Input id="businessName" name="businessName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rfc">RFC</Label>
                <Input id="rfc" name="rfc" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legalName">Nombre Legal</Label>
                <Input id="legalName" name="legalName" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partnerType">Tipo de Socio</Label>
                <Select name="partnerType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige el tipo de socio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Cliente</SelectItem>
                    <SelectItem value="partner">Socio</SelectItem>
                    <SelectItem value="both">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRegimeId">Régimen Fiscal</Label>
              <Select name="taxRegimeId" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elige tu régimen fiscal" />
                </SelectTrigger>
                <SelectContent>
                  {regimes.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {`${item.code} - ${item.description}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <fieldset className="border p-4 rounded-md">
              <legend className="text-sm font-medium px-1">Dirección</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address.street">Calle</Label>
                  <Input id="address.street" name="address.street" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address.exterior">No. Exterior</Label>
                  <Input id="address.exterior" name="address.exterior" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address.interior">No. Interior</Label>
                  <Input id="address.interior" name="address.interior" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address.colony">Colonia</Label>
                  <Input id="address.colony" name="address.colony" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address.municipality">Municipio</Label>
                  <Input
                    id="address.municipality"
                    name="address.municipality"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address.state">Estado</Label>
                  <Input id="address.state" name="address.state" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address.country">País</Label>
                  <Input id="address.country" name="address.country" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address.postalCode">Código Postal</Label>
                  <Input id="address.postalCode" name="address.postalCode" />
                </div>
              </div>
            </fieldset>

            <fieldset className="border p-4 rounded-md">
              <legend className="text-sm font-medium px-1">Contacto</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact.email">Email</Label>
                  <Input id="contact.email" name="contact.email" type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact.phone">Teléfono</Label>
                  <Input id="contact.phone" name="contact.phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact.website">Sitio Web</Label>
                  <Input id="contact.website" name="contact.website" />
                </div>
              </div>
            </fieldset>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Términos de Pago (días)</Label>
                <Input id="paymentTerms" name="paymentTerms" type="number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Límite de Crédito</Label>
                <Input id="creditLimit" name="creditLimit" type="number" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas (separadas por coma)</Label>
              <Input id="tags" name="tags" />
            </div>
          </div>
          <DialogFooter>
            <SubmitButton>Guardar Contacto</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
