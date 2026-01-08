export function getIvaTypeLabel(ivaType: string | null) {
  switch (ivaType) {
    case "creditable":
      return {
        text: "Acreditable",
        className: "text-chart-4 bg-chart-4/10 border-chart-4/20",
      };
    case "charged":
      return {
        text: "Cobrado",
        className: "text-chart-1 bg-chart-1/10 border-chart-1/20",
      };
    case "exempt":
      return {
        text: "Exento",
        className: "text-muted-foreground bg-muted/50 border-muted",
      };
    default:
      return {
        text: "N/A",
        className: "text-muted-foreground bg-muted/50 border-muted",
      };
  }
}
