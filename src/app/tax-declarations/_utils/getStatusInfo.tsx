import {
  CircleCheck,
  CircleDashed,
  CircleDotDashed,
  ClockFading,
  ExternalLink,
} from "lucide-react";

export type DeclarationStatus = "draft" | "validated" | "exported" | "filed";

export function getStatusInfo(status: string): {
  text: string;
  icon: React.ReactNode;
  className: string;
} {
  switch (status as DeclarationStatus) {
    case "filed":
      return {
        text: "Finalizada",
        icon: <CircleCheck className="h-4 w-4" />,
        className: "text-chart-4 bg-chart-4/10 border-chart-4/20",
      };
    case "validated":
      return {
        text: "Verificada",
        icon: <CircleDotDashed className="h-4 w-4" />,
        className: "text-chart-1 bg-chart-1/10 border-chart-1/20",
      };
    case "draft":
      return {
        text: "Borrador",
        icon: <CircleDashed className="h-4 w-4" />,
        className: "text-muted-foreground bg-muted/50 border-muted",
      };
    case "exported":
      return {
        text: "Exportada",
        icon: <ExternalLink className="h-4 w-4" />,
        className: "text-chart-5 bg-chart-5/10 border-chart-5/20",
      };
    default: {
      // TypeScript exhaustiveness check for DeclarationStatus
      const _exhaustiveCheck: never = status as never;
      
      // Fallback for runtime values
      if (status === "pending" || status === "Pendiente de declarar" || !status || status === "Pendiente") {
        return {
          text: "Pendiente",
          icon: <ClockFading className="h-4 w-4" />,
          className: "text-chart-2 bg-chart-2/10 border-chart-2/20",
        };
      }
      
      return {
        text: "Desconocida",
        icon: <ClockFading className="h-4 w-4" />,
        className: "text-muted-foreground bg-muted/50 border-muted",
      };
    }
  }
}

