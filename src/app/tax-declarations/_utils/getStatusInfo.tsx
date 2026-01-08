import {
  CircleCheck,
  CircleDashed,
  CircleDotDashed,
  ClockFading,
} from "lucide-react";

export function getStatusInfo(status: string): {
  text: string;
  icon: React.ReactNode;
  className: string;
} {
  switch (status) {
    case "filed":
      return {
        text: "Presentada",
        icon: <CircleCheck className="h-4 w-4" />,
        className: "text-chart-4 bg-chart-4/10 border-chart-4/20",
      };
    case "validated":
      return {
        text: "Validada",
        icon: <CircleDotDashed className="h-4 w-4" />,
        className: "text-chart-1 bg-chart-1/10 border-chart-1/20",
      };
    case "draft":
      return {
        text: "Borrador",
        icon: <CircleDashed className="h-4 w-4" />,
        className: "text-muted-foreground bg-muted/50 border-muted",
      };
    default:
      return {
        text: "Pendiente",
        icon: <ClockFading className="h-4 w-4" />,
        className: "text-chart-2 bg-chart-2/10 border-chart-2/20",
      };
  }
}
