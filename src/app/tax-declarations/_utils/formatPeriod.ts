import { format } from "date-fns";
import { es } from "date-fns/locale";

export function formatPeriod(period: string) {
  const [year, month] = period.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return format(date, "MMMM yyyy", { locale: es });
}
