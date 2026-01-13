import { Calendar } from "lucide-react";
import Dashboard from "@/components/dashboard";

export default async function Home() {
  const currentDate = new Date();
  const monthName = currentDate.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-linear-to-br from-muted/30 via-background to-background">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-mono uppercase tracking-widest text-primary">
                {monthName}
              </span>
            </div>

            <h1 className="text-6xl font-light tracking-tight leading-[1.1]">
              Panel de Control
              <span className="block text-muted-foreground mt-2">
                CFDI Assistant
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Gestión inteligente de comprobantes fiscales digitales. Monitorea
              tus facturas, analiza tendencias y mantén el control total de tu
              operación fiscal.
            </p>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-6 py-12">
        <Dashboard monthName={monthName} />
      </div>
    </div>
  );
}
