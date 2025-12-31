import { CheckCircle, Loader2, XCircle } from "lucide-react";

// This interface is shared between the server action and the client component.
export interface InvoiceState {
  id: string;
  fileName: string;
  status:
    | "queued"
    | "parsing"
    | "validating"
    | "saving"
    | "classifying"
    | "success"
    | "error";
  progress: number;
  error?: string;
}

// This component can be rendered on the server.
export function StatusBadge({ status }: { status: InvoiceState["status"] }) {
  const labels = {
    queued: "En cola",
    parsing: "Parseando XML",
    validating: "Validando SAT",
    saving: "Guardando",
    classifying: "Clasificando",
    success: "Completada",
    error: "Error",
  };

  return <span className="text-xs">{labels[status]}</span>;
}

// This component can also be rendered on the server.
export function UploadItem({ upload }: { upload: InvoiceState }) {
  return (
    <div key={upload.id} className="group flex items-center py-4">
      <div className="mr-3 grid size-10 shrink-0 place-content-center rounded border bg-muted">
        {upload.status === "success" && (
          <CheckCircle className="h-5 w-5 text-green-600" />
        )}
        {upload.status === "error" && (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
        {!["success", "error"].includes(upload.status) && (
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        )}
      </div>
      <div className="flex flex-col w-full mb-1">
        <div className="flex justify-between gap-2">
          <span className="select-none text-base/6 text-foreground group-disabled:opacity-50 sm:text-sm/6">
            {upload.fileName}
          </span>
          <StatusBadge status={upload.status} />
        </div>
        {upload.error && (
          <p className="text-sm text-red-600 mt-1">{upload.error}</p>
        )}
      </div>
    </div>
  );
}
