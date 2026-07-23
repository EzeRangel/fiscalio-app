import DemoDashboard from "@/components/demo/import-demo";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-linear-to-br from-muted/30 via-background to-background">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-6xl font-light tracking-tight leading-[1.1]">
              Fiscalio
              <span className="block text-muted-foreground mt-2">
                Panel de Control
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Asistencia para la organización de comprobantes fiscales
              digitales. Monitorea tus facturas, analiza tendencias y mantén el
              control de tus registros.
            </p>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-6 py-12">
        <DemoDashboard />
      </div>
    </div>
  );
}
