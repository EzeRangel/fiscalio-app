"use client";

import { createAccount } from "@/actions/chart-of-accounts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Account,
  AccountFormSchema,
  AccountFormValues,
} from "@/types/chart-of-accounts";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Info } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface Props {
  accounts: Account[];
}

export function AccountFormDialog({ accounts = [] }: Props) {
  const [open, setOpen] = useState(false);
  const topLevelAccounts = accounts.filter((acc) => {
    const { level } = acc;

    return level === 0;
  });

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(AccountFormSchema),
    defaultValues: {
      accountCode: "",
      accountName: "",
      accountType: "income",
      accountSubtype: "",
      satCode: "",
      isDeductible: false,
      deductionPercentage: "100.00",
      ivaAccreditationPercentage: "0.00",
      description: "",
      isActive: true,
    },
  });

  const { executeAsync } = useAction(createAccount, {
    onError({ error: { serverError } }) {
      const message = serverError ?? "Error desconocido";

      toast.error("Ocurrió un error", { description: message });
    },
  });

  const onSubmit = async (data: AccountFormValues) => {
    await executeAsync(data);

    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Cuenta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light">
            Nueva Cuenta Contable
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="accountCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Cuenta *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1000"
                        className="font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="satCode"
                render={({ field }) => (
                  <FormItem>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <FormLabel>
                            Código SAT{" "}
                            <span className="text-muted-foreground">(?)</span>
                          </FormLabel>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Encuentra la referencia en este{" "}
                            <a
                              href="http://omawww.sat.gob.mx/fichas_tematicas/buzon_tributario/Documents/codigo_agrupador.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              documento
                            </a>
                            .
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <FormControl>
                      <Input
                        placeholder="101.01"
                        className="font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Código del catálogo SAT
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Cuenta *</FormLabel>
                  <FormControl>
                    <Input placeholder="Activo Circulante" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Cuenta *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="asset">Activo</SelectItem>
                        <SelectItem value="liability">Pasivo</SelectItem>
                        <SelectItem value="equity">Capital</SelectItem>
                        <SelectItem value="income">Ingreso</SelectItem>
                        <SelectItem value="expense">Gasto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountSubtype"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtipo</FormLabel>
                    <FormControl>
                      <Input placeholder="Circulante, Fijo, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="parentAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuenta Padre (Opcional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin cuenta padre" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin cuenta padre</SelectItem>
                      {topLevelAccounts.map((item) => (
                        <SelectItem
                          key={item.id}
                          value={item.id.toString()}
                        >{`${item.accountCode} - ${item.accountName}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Para crear estructura jerárquica
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el propósito y uso de esta cuenta..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Deductibility Section */}
            <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
              <h4 className="text-sm font-medium">Configuración Fiscal</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isDeductible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-background">
                      <div className="space-y-0.5">
                        <FormLabel className="text-xs font-medium">
                          Deducible ISR
                        </FormLabel>
                        <FormDescription className="text-[10px]">
                          Deducible para ISR
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("isDeductible") && (
                  <FormField
                    control={form.control}
                    name="deductionPercentage"
                    render={({ field }) => (
                      <FormItem className="rounded-lg border p-3 bg-background">
                        <FormLabel className="text-xs font-medium">
                          % Deducción ISR
                        </FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input
                              className="font-mono h-8 text-xs"
                              placeholder="100.00"
                              {...field}
                            />
                            <span className="text-xs text-muted-foreground">
                              %
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* IVA Accreditation */}
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="ivaAccreditationPercentage"
                  render={({ field }) => (
                    <FormItem className="rounded-lg border p-3 bg-background">
                      <div className="flex items-center gap-2 mb-2">
                        <FormLabel className="text-xs font-medium">
                          % IVA Acreditable
                        </FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs max-w-xs">
                                Porcentaje del IVA pagado que puede ser acreditado para esta cuenta.
                                Por ejemplo, 50% para gastos compartidos entre negocio y personal.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            className="font-mono h-8 text-xs"
                            placeholder="0.00"
                            {...field}
                          />
                          <span className="text-xs text-muted-foreground">
                            %
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        IVA acreditable para declaraciones de impuestos
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium">
                      Cuenta Activa
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Permitir uso de esta cuenta en clasificaciones
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Crear Cuenta</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
