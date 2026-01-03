import { getChartOfAccountsByOrg } from "@/data/chart-of-accounts";
import { Settings } from "lucide-react";
import { Filters } from "./_components/filters";
import { Table } from "./_components/table";
import { Account, HierarchicalAccountFull } from "@/types/chart-of-accounts";

async function getData() {
  const [accounts] = await Promise.all([getChartOfAccountsByOrg()]);

  return { accounts };
}

function groupAccountsByParent(accounts: Account[]): HierarchicalAccountFull[] {
  // Crear un mapa para búsqueda rápida por id
  const accountMap = new Map<number, HierarchicalAccountFull>();

  // Crear la estructura base para cada cuenta
  accounts.forEach((account) => {
    accountMap.set(account.id, {
      ...account,
      children: [],
    } as HierarchicalAccountFull);
  });

  // Array para las cuentas raíz (sin parent)
  const rootAccounts: HierarchicalAccountFull[] = [];

  // Construir la jerarquía
  accounts.forEach((account) => {
    const node = accountMap.get(account.id);

    if (!node) {
      return;
    }

    if (account.parentAccountId === null) {
      // Es una cuenta raíz
      rootAccounts.push(node);
    } else {
      // Es una cuenta hija, encontrar su padre
      const parent = accountMap.get(account.parentAccountId);
      if (parent) {
        parent.children?.push(node);
      } else {
        // Si el padre no existe en los datos, tratarlo como raíz
        rootAccounts.push(node);
      }
    }
  });

  return rootAccounts;
}

export default async function ChartOfAccountsPage() {
  const { accounts } = await getData();
  const groupedAccounts = groupAccountsByParent(accounts);

  // Calculate the required values
  const totalActiveAccounts = accounts.filter(
    (account) => account.isActive
  ).length;
  const mainAccounts = accounts.filter(
    (account) => account.parentAccountId === null
  ).length;

  return (
    <section className="bg-background">
      <header className="border-b border-border bg-linear-to-br from-[hsl(var(--chart-5))]/5 via-background to-background">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-light tracking-tight">
                Catálogo de Cuentas
              </h1>
              <p className="text-muted-foreground font-mono text-sm">
                Define y organiza tu estructura contable. Cada factura será
                clasificada automáticamente según estas cuentas.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-light">
                  {mainAccounts}
                </span>
                <span className="text-sm text-muted-foreground">
                  cuentas principales
                </span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-light">
                  {totalActiveAccounts}
                </span>
                <span className="text-sm text-muted-foreground">
                  cuentas totales
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <Filters accounts={accounts} />
      <Table accounts={groupedAccounts} />

      <div className="container mx-auto px-6">
        <div className="mt-8 p-6 bg-[hsl(var(--chart-5))]/5 border border-[hsl(var(--chart-5))]/20 rounded-lg">
          <div className="flex gap-4">
            <Settings className="h-5 w-5 text-[hsl(var(--chart-5))] shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-medium">
                Sistema de Clasificación Inteligente
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                El catálogo de cuentas es la base del sistema de clasificación
                automática. Define reglas para cada cuenta y nuestra IA
                aprenderá a clasificar tus facturas automáticamente según los
                patrones que identifique.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
