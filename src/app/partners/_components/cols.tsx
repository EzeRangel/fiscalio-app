"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { BusinessPartnerWithAnalytics } from "@/types/businessPartners";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, FileText, MoreHorizontal, Tag, Trash2 } from "lucide-react";
import Link from "next/link";

const getPartnerTypeBadge = (type: string) => {
  switch (type) {
    case "client":
      return (
        <Badge
          variant="outline"
          className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
        >
          Cliente
        </Badge>
      );
    case "supplier":
    case "provider":
      return (
        <Badge
          variant="outline"
          className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
        >
          Proveedor
        </Badge>
      );
    case "both":
      return (
        <Badge
          variant="outline"
          className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
        >
          Ambos
        </Badge>
      );
  }
};

interface Actions {
  onManageTags: (partner: BusinessPartnerWithAnalytics) => void;
  onDeactivate: (partner: BusinessPartnerWithAnalytics) => void;
}

export const getColumns = (
  actions: Actions
): ColumnDef<BusinessPartnerWithAnalytics>[] => [
  {
    accessorKey: "businessName",
    header: "Socio",
    cell: ({ row: { original: partner } }) => {
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium leading-none flex items-center gap-2">
            {partner.businessName}
            {!partner.isActive && (
              <Badge
                variant="outline"
                className="text-xs bg-muted text-muted-foreground"
              >
                Inactivo
              </Badge>
            )}
          </div>
          {partner.legalName && partner.legalName !== partner.businessName && (
            <div className="text-xs text-muted-foreground">
              {partner.legalName}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "rfc",
    header: "RFC",
    cell: ({ row }) => {
      return <span className="font-mono text-sm">{row.original.rfc}</span>;
    },
  },
  {
    accessorKey: "partnerType",
    header: "Tipo",
    cell: ({ row }) => getPartnerTypeBadge(row.original.partnerType),
  },
  {
    id: "invoices",
    header: () => <div className="text-center">Facturas</div>,
    accessorKey: "invoiceCount",
    cell: ({ row: { original: partner } }) => {
      return (
        <div className="text-center">
          <div className="text-sm font-mono font-medium">
            {partner.invoiceCount}
          </div>
        </div>
      );
    },
  },
  {
    id: "volume",
    header: () => <div className="text-right">Volumen</div>,
    accessorKey: "totalVolume",
    cell: ({ row: { original: partner } }) => {
      return (
        <div className="text-right">
          <div className="font-mono text-sm font-medium">
            {formatCurrency(partner.totalVolume)}
          </div>
          {partner.creditLimit && Number(partner.creditLimit) > 0 && (
            <div className="text-[10px] text-muted-foreground font-mono uppercase">
              Límite: {formatCurrency(Number(partner.creditLimit))}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "tags",
    header: "Etiquetas",
    cell: ({ row: { original: partner } }) => {
      return (
        <div className="flex flex-wrap gap-1">
          {partner.tags?.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] uppercase font-medium"
            >
              {tag}
            </Badge>
          ))}
          {partner.tags && partner.tags?.length > 2 && (
            <Badge
              variant="secondary"
              className="text-[10px] uppercase font-medium"
            >
              +{partner.tags?.length - 2}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row: { original: partner } }) => {
      return (
        <div className="w-[60px]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/invoices?partner=${partner.id}`}>
                  <FileText className="h-4 w-4" />
                  Ver facturas
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onManageTags(partner)}>
                <Tag className="h-4 w-4" />
                Gestionar etiquetas
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => actions.onDeactivate(partner)}
              >
                <Trash2 className="h-4 w-4" />
                {partner.isActive ? "Desactivar" : "Activar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
