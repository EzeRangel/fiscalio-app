"use client";

import { FiscalValidationError } from "@/lib/fiscal-validation";
import { AlertTriangleIcon, InfoIcon, XCircleIcon } from "lucide-react";

interface Props {
  validations: FiscalValidationError[];
}

export function ValidationMessages({ validations }: Props) {
  return (
    <>
      {validations.length > 0 && (
        <div className="mb-12">
          <div className="border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 rounded-r-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="mt-0.5">
                  <AlertTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                    Inconsistencia Fiscal
                  </h3>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Se han detectado inconsistencias en esta factura que afectan
                    su validez para reportes fiscales:
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {validations.map((error, index) => {
                  const severityConfig = {
                    warning: {
                      icon: AlertTriangleIcon,
                      bgClass: "bg-amber-100 dark:bg-amber-900/30",
                      textClass: "text-amber-800 dark:text-amber-200",
                      codeClass: "text-amber-900 dark:text-amber-100",
                      borderClass: "border-amber-200 dark:border-amber-800",
                    },
                    error: {
                      icon: XCircleIcon,
                      bgClass: "bg-red-100 dark:bg-red-900/30",
                      textClass: "text-red-800 dark:text-red-200",
                      codeClass: "text-red-900 dark:text-red-100",
                      borderClass: "border-red-200 dark:border-red-800",
                    },
                    info: {
                      icon: InfoIcon,
                      bgClass: "bg-blue-100 dark:bg-blue-900/30",
                      textClass: "text-blue-800 dark:text-blue-200",
                      codeClass: "text-blue-900 dark:text-blue-100",
                      borderClass: "border-blue-200 dark:border-blue-800",
                    },
                  };

                  const config = severityConfig[error.severity];
                  const Icon = config.icon;

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${config.borderClass} ${config.bgClass}`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon
                          className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.textClass}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <code
                              className={`text-xs font-mono font-medium ${config.codeClass}`}
                            >
                              {error.code}
                            </code>
                            <span className="text-xs text-muted-foreground">
                              •
                            </span>
                            <span className="text-xs capitalize text-muted-foreground">
                              {error.field}
                            </span>
                          </div>
                          <p
                            className={`text-sm leading-relaxed ${config.textClass}`}
                          >
                            {error.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
