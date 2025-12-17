"use client";

import { toast } from "sonner";
import { Label } from "@/components/ui/label";
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
import { Input } from "../ui/input";
import { saveOrganization } from "@/actions/organizations";
import { useAction } from "next-safe-action/hooks";
import { SubmitButton } from "../ui/submit-button"; // Import the new component
import { useState } from "react";
import { taxRegimes } from "@/db";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type Regime = typeof taxRegimes.$inferSelect;

interface Props {
  regimes: Regime[];
}

export default function OrganizationDialog({ regimes = [] }: Props) {
  const [open, setOpen] = useState(false);

  const { execute } = useAction(saveOrganization, {
    onSuccess: () => {
      toast.success("Organization saved successfully!");
      setOpen(false);
    },
    onError: ({ error: { validationErrors, serverError } }) => {
      if (serverError) {
        toast.error(serverError);
      } else if (validationErrors) {
        console.log(validationErrors);
        toast.info("Please correct the errors in the form");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="ml-2 h-auto p-0">
          Configurar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-162.5 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Organización</DialogTitle>
          <DialogDescription>
            Ingresa los datos de tu empresa o negocio
          </DialogDescription>
        </DialogHeader>
        <form action={execute}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Nombre o Razón Social</Label>
              <Input id="businessName" name="businessName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rfc">RFC</Label>
              <Input id="rfc" name="rfc" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRegimeId">Régimen Fiscal</Label>
              <Select name="taxRegimeId">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elige tu régimen fiscal" />
                </SelectTrigger>
                <SelectContent>
                  {regimes.map((item) => {
                    return (
                      <SelectItem
                        key={item.id}
                        value={item.id.toString()}
                      >{`${item.code}-${item.description}`}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalName">Nombre Legal</Label>
              <Input id="legalName" name="legalName" />
            </div>
            <fieldset className="border p-4 rounded-md">
              <legend className="text-sm font-medium px-1">Dirección</legend>
              <div className="space-y-2">
                <Label htmlFor="address.street">Calle</Label>
                <Input id="address.street" name="address.street" />
                <Label htmlFor="address.exterior">No. Exterior</Label>
                <Input id="address.exterior" name="address.exterior" />
                <Label htmlFor="address.interior">No. Interior</Label>
                <Input id="address.interior" name="address.interior" />
                <Label htmlFor="address.colony">Colonia</Label>
                <Input id="address.colony" name="address.colony" />
                <Label htmlFor="address.municipality">Municipio</Label>
                <Input id="address.municipality" name="address.municipality" />
                <Label htmlFor="address.state">Estado</Label>
                <Input id="address.state" name="address.state" />
                <Label htmlFor="address.country">País</Label>
                <Input id="address.country" name="address.country" />

                <Label htmlFor="address.postalCode">Código Postal</Label>
                <Input id="address.postalCode" name="address.postalCode" />
              </div>
            </fieldset>

            <fieldset className="border p-4 rounded-md">
              <legend className="text-sm font-medium px-1">Contacto</legend>
              <div className="space-y-2">
                <Label htmlFor="contact.email">Email</Label>
                <Input id="contact.email" name="contact.email" type="email" />
                <Label htmlFor="contact.phone">Teléfono</Label>
                <Input id="contact.phone" name="contact.phone" />
                <Label htmlFor="contact.website">Sitio Web</Label>
                <Input id="contact.website" name="contact.website" />
              </div>
            </fieldset>
          </div>
          <DialogFooter>
            <SubmitButton>Guardar Organización</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
