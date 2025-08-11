import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";

const currency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function InvoicesList() {
  const invoices = useAppStore((s) => s.invoices);
  const clients = useAppStore((s) => s.clients);

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "Unknown";

  return (
    <div className="space-y-6">
      <SEO title="HustleHub — Invoices" description="Manage invoices with filters and quick actions." />
      <Card>
        <CardHeader>
          <CardTitle>Invoice Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.invoiceNumber}</TableCell>
                  <TableCell>{clientName(i.clientId)}</TableCell>
                  <TableCell className="text-right">{currency(i.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={i.status === "overdue" ? "destructive" : i.status === "paid" ? "secondary" : "default"}>
                      {i.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(i.dueDate).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
