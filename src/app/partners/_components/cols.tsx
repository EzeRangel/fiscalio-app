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
import { BusinessPartner } from "@/types/businessPartners";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, FileText, MoreHorizontal, Tag, Trash2 } from "lucide-react";

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

export const columns: ColumnDef<BusinessPartner>[] = [
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
          {partner.legalName !== partner.businessName && (
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
    accessorKey: "taxRegimeId",
    header: "Régimen Fiscal",
    cell: ({ row }) => {
      return (
        <span className="text-sm text-muted-foreground">
          {row.original.taxRegimeId}
        </span>
      );
    },
  },
  {
    id: "invoices",
    header: "Facturas",
    // TODO: Obtener facturas del socio...
    cell: ({ row: { original: partner } }) => {
      return (
        <div className="text-center">
          <div className="space-y-0.5">
            <div className="text-sm font-mono font-medium">2</div>
            <div className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("es-MX", {
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "volume",
    header: "Volumen",
    cell: ({ row: { original: partner } }) => {
      return (
        <div className="text-right">
          {/* <div className="font-mono text-sm font-medium">
            ${(partner.totalVolume / 1000).toFixed(0)}K
          </div> */}
          {partner.creditLimit && (
            <div className="text-xs text-muted-foreground font-mono">
              Crédito: ${(Number(partner.creditLimit) / 1000).toFixed(0)}K
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
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {partner.tags && partner.tags?.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{partner.tags?.length - 2}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
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
              <DropdownMenuItem
              //onClick={() => handleOpenDialog(partner)}
              >
                <Edit className="h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="h-4 w-4" />
                Ver facturas
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Tag className="h-4 w-4" />
                Gestionar etiquetas
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4" />
                {row.original.isActive ? "Desactivar" : "Activar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
