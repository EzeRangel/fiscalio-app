"use client";

import { useQuery } from "@tanstack/react-query";
import { getLatestInvoicesAction } from "@/actions/get-latest-invoices";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function InvoicesList() {
  const {
    data: invoices,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["latest-invoices"],
    queryFn: () => getLatestInvoicesAction(),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError || !invoices) {
    return <div>Error fetching invoices.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimos Comprobantes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Socio de Negocio</TableHead>
              <TableHead>Folio</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  {invoice.businessPartner?.legalName ?? "N/A"}
                </TableCell>
                <TableCell>
                  {invoice.internalFolio ?? invoice.folioFiscal}
                </TableCell>
                <TableCell>
                  {new Date(invoice.invoiceDate).toLocaleDateString()}
                </TableCell>
                <TableCell>{invoice.total}</TableCell>
                <TableCell>
                  <Badge>{invoice.status}</Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/invoices/${invoice.id}`}>Ver Detalles</Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
