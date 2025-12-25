"use client";

import z from "zod/v4";
import { createOnboardingOrganization } from "@/actions/organizations";
import { Card } from "@/components/ui/card";
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
import { Regime } from "@/types/taxRegimes";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { baseOrganizationSchema } from "@/types/organizations";
import { SubmitButton } from "@/components/ui/submit-button";

interface Props {
  regimes: Regime[];
}

const formSchema = baseOrganizationSchema.extend({
  taxRegimeId: z.string().min(1, "Selecciona un régimen fiscal"),
});

type FormValues = z.infer<typeof formSchema>;

export function OnboardingForm({ regimes }: Props) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      rfc: "",
    },
  });

  const { executeAsync, isExecuting } = useAction(
    createOnboardingOrganization,
    {
      onSuccess: () => {
        router.replace("/");
      },
    }
  );

  const handleSubmit = (values: FormValues) => {
    console.log(values);

    executeAsync(values);
  };

  return (
    <Card className="p-8 shadow-lg border-border/50 bg-card/80 backdrop-blur-sm">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Negocio</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ejemplo: Corporativo Tecnológico del Norte S.A."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  El nombre legal o comercial de tu empresa
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rfc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RFC (Registro Federal de Contribuyentes)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ABC123456XYZ"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e.target.value.toUpperCase());
                    }}
                    maxLength={13}
                    className="font-mono"
                  />
                </FormControl>
                <FormDescription>
                  13 caracteres alfanuméricos (12 para personas físicas)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="taxRegimeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Régimen Fiscal</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu régimen fiscal" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {regimes.map((regime) => (
                      <SelectItem key={regime.id} value={String(regime.id)}>
                        <span className="font-mono text-xs text-muted-foreground mr-2">
                          {regime.code}
                        </span>
                        {regime.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  El régimen bajo el cual tributa tu organización
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <SubmitButton
            className="w-full gap-2 h-12 text-base"
            disabled={isExecuting}
          >
            {isExecuting ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Creando organización...
              </>
            ) : (
              <>
                Comenzar a usar FDI Assistant
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </SubmitButton>
        </form>
      </Form>
    </Card>
  );
}
