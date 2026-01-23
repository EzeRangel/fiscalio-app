import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  message?: string;
}

export function DisclaimerBanner({ 
  className, 
  message = "Esta plataforma es una herramienta de asistencia e información. Los cálculos presentados son estimaciones y no sustituyen la asesoría fiscal profesional ni las declaraciones oficiales ante el SAT." 
}: Props) {
  return (
    <div className={cn(
      "flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-blue-700 dark:text-blue-400",
      className
    )}>
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="leading-relaxed">
        {message}
      </p>
    </div>
  );
}
