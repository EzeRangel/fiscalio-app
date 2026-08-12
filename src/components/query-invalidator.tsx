"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function QueryInvalidator() {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-invoices"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
  }, [queryClient]);

  return null;
}
