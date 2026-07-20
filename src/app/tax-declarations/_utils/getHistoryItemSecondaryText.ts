import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DeclarationLike {
  status: string | null;
  filedAt?: Date | string | null;
  exportedAt?: Date | string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export function getHistoryItemSecondaryText(declaration: DeclarationLike): string {
  const formatDate = (dateInput: Date | string | null | undefined): string | null => {
    if (!dateInput) return null;
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return format(date, "d 'de' MMMM yyyy", { locale: es });
  };

  const status = declaration.status;

  if (status === "filed") {
    const formatted = formatDate(declaration.filedAt);
    return formatted ? `Presentada el ${formatted}` : "Presentada";
  }

  if (status === "exported") {
    const formatted = formatDate(declaration.exportedAt);
    return formatted ? `Exportada el ${formatted}` : "Exportada";
  }

  if (status === "validated") {
    const formatted = formatDate(declaration.updatedAt);
    return formatted ? `Verificada el ${formatted}` : "Verificada";
  }

  if (status === "draft") {
    const formatted = formatDate(declaration.updatedAt);
    return formatted ? `Última edición el ${formatted}` : "Borrador";
  }

  // Fallback for default/other statuses
  const formatted = formatDate(declaration.createdAt);
  return formatted ? `Creada el ${formatted}` : "Pendiente";
}
