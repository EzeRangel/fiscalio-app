"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/actions/audit-logs";
import { AuditLogPane } from "@/components/audit-log-pane";
import { toast } from "sonner";
import { useEffect } from "react";

interface EntityAuditLogProps {
  entityType: string;
  entityId: number;
}

export function EntityAuditLog({ entityType, entityId }: EntityAuditLogProps) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["auditLogs", entityType, entityId],
    queryFn: () => getAuditLogs({ entityType, entityId }),
  });

  useEffect(() => {
    if (error) {
      toast.error("Error al cargar el historial de cambios.");
    }
  }, [error]);

  const auditLogsData = data?.data || [];

  if (isLoading) {
    // You can return a loader here if you want
    return null;
  }

  return (
    <AuditLogPane
      logs={auditLogsData}
      entityType={entityType}
      entityId={entityId.toString()}
    />
  );
}
