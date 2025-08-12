import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Plus, Search, MoreHorizontal, FileText, Send, CheckCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { clients_all, create_message_log, invoices_all, update_invoice } from "@/data/collections";

const currency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function InvoicesList() {
  const navigate = useNavigate();
  const { data: invoices = [], refetch: refetchInvoices } = useQuery({ queryKey: ["invoices_all"], queryFn: invoices_all });
  const { data: clients = [] } = useQuery({ queryKey: ["clients_all"], queryFn: clients_all });

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const clientName = (id: string) => clients.find((c: any) => c.id === id)?.name ?? "Unknown";

  const filteredInvoices = invoices.filter((invoice: any) => {
    if (activeTab !== "all" && invoice.status !== activeTab) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (invoice.invoice_number || "").toLowerCase().includes(query) ||
        clientName(invoice.client_id).toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid": return "secondary";
      case "overdue": return "destructive";
      case "sent": return "default";
      case "draft": return "outline";
      default: return "default";
    }
  };

  const getDaysOverdue = (due_date: string, status: string) => {
    if (status === "paid") return null;
    const today = new Date();
    const due = new Date(due_date);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleMarkPaid = async (invoiceId: string) => {
    const utr = prompt("Enter UTR/Transaction ID:");
    if (utr) {
      await update_invoice(invoiceId, { status: "paid", paid_date: new Date().toISOString(), utr_reference: utr });
      await create_message_log({ related_type: "invoice", related_id: invoiceId, channel: "whatsapp", template_used: "invoice_paid", outcome: "recorded" });
      await refetchInvoices();
    }
  };

  const tabCounts = {
    all: invoices.length,
    draft: invoices.filter((i: any) => i.status === "draft").length,
    sent: invoices.filter((i: any) => i.status === "sent").length,
    overdue: invoices.filter((i: any) => i.status === "overdue").length,
    paid: invoices.filter((i: any) => i.status === "paid").length,
  };

  return (
    <div className="space-y-6">
      <SEO title="HustleHub — Invoices" description="Manage invoices with filters and quick actions." />
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoice Management</h1>
        <Button onClick={() => navigate("/invoices/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Invoices</CardTitle>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({tabCounts.all})</TabsTrigger>
              <TabsTrigger value="draft">Draft ({tabCounts.draft})</TabsTrigger>
              <TabsTrigger value="sent">Sent ({tabCounts.sent})</TabsTrigger>
              <TabsTrigger value="overdue">Overdue ({tabCounts.overdue})</TabsTrigger>
              <TabsTrigger value="paid">Paid ({tabCounts.paid})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice: any) => {
                    const daysOverdue = getDaysOverdue(invoice.due_date, invoice.status);
                    const issueDate = new Date(invoice.issue_date);
                    const daysSinceIssue = Math.ceil((Date.now() - issueDate.getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{clientName(invoice.client_id)}</TableCell>
                        <TableCell className="text-right">{currency(invoice.total_amount)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={daysOverdue && daysOverdue > 0 ? "text-destructive" : ""}>
                            {new Date(invoice.due_date).toLocaleDateString()}
                            {daysOverdue && daysOverdue > 0 && (
                              <div className="text-xs">({daysOverdue} days overdue)</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {daysSinceIssue} day{daysSinceIssue !== 1 ? 's' : ''}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              {invoice.status !== "paid" && (
                                <DropdownMenuItem onClick={() => handleMarkPaid(invoice.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark Paid
                                </DropdownMenuItem>
                              )}
                              {(invoice.status === "sent" || invoice.status === "overdue") && (
                                <DropdownMenuItem>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Reminder
                                </DropdownMenuItem>
                              )}
                              {invoice.status === "draft" && (
                                <>
                                  <DropdownMenuItem>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Invoice
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredInvoices.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No invoices found for the selected filter.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}