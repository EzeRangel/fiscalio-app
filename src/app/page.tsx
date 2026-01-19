import Dashboard from "@/components/dashboard";

export default async function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-linear-to-br from-muted/30 via-background to-background">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-3xl space-y-6">
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
        <Dashboard />
      </div>
    </div>
  );
}