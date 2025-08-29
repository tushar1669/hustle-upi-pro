import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Plus, MoreHorizontal, Eye, Send, MessageSquare, Edit, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  invoices_all,
  clients_all,
  update_invoice,
  create_message_log,
  reminders_by_invoice,
  create_reminder,
  update_reminder,
  settings_one,
  invoice_with_items,
} from "@/data/collections";
import { CACHE_KEYS, invalidateInvoiceCaches } from "@/hooks/useCache";
import { useToast } from "@/hooks/use-toast";
import { useCelebrationContext } from "@/components/CelebrationProvider";
import InvoicePreviewModal from "@/components/InvoicePreviewModal";

const currency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function InvoicesList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices = [] } = useQuery({ queryKey: ["invoices_all"], queryFn: invoices_all });
  const { data: clients = [] } = useQuery({ queryKey: ["clients_all"], queryFn: clients_all });
  const { data: settings } = useQuery({ queryKey: ["settings_one"], queryFn: settings_one });
  const { celebrate } = useCelebrationContext();

  const [activeTab, setActiveTab] = useState<"all" | "draft" | "sent" | "overdue" | "paid">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paidDate, setPaidDate] = useState("");
  const [utrReference, setUtrReference] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedPreviewInvoice, setSelectedPreviewInvoice] = useState<any>(null);

  const clientName = (id: string) => clients.find((c: any) => c.id === id)?.name || "Unknown";

  const filteredInvoices = invoices.filter((invoice: any) => {
    const matchesTab = activeTab === "all" || invoice.status === activeTab;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      invoice.invoice_number.toLowerCase().includes(searchLower) ||
      clientName(invoice.client_id).toLowerCase().includes(searchLower);
    return matchesTab && matchesSearch;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "secondary";
      case "overdue":
        return "destructive";
      case "sent":
        return "default";
      case "draft":
        return "outline";
      default:
        return "outline";
    }
  };

  const getDaysOverdue = (due_date: string, status: string) => {
    if (status === "paid") return 0;
    const today = new Date();
    const dueDate = new Date(due_date);
    const diffTime = today.getTime() - dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Positive => overdue, negative => days left
  };

  const handleMarkPaid = async () => {
    if (!selectedInvoice || !paidDate) return;

    try {
      await update_invoice(selectedInvoice.id, {
        status: "paid",
        paid_date: new Date(paidDate).toISOString(),
        utr_reference: utrReference || null,
      });

      await create_message_log({
        related_type: "invoice",
        related_id: selectedInvoice.id,
        channel: "whatsapp",
        template_used: "invoice_paid",
        outcome: "updated",
      });

      await invalidateInvoiceCaches(queryClient);

      setShowMarkPaidModal(false);
      setSelectedInvoice(null);
      setPaidDate("");
      setUtrReference("");

      toast({ title: "Invoice marked as paid" });
      celebrate("mark_paid");
    } catch {
      toast({ title: "Error updating invoice", variant: "destructive" });
    }
  };

  const handleSendReminder = async (invoice: any) => {
    const client = clients.find((c: any) => c.id === invoice.client_id);
    if (!client || !settings) return;

    try {
      const reminders = await reminders_by_invoice(invoice.id);
      const pendingReminder = reminders.find((r: any) => r.status === "pending");

      if (pendingReminder) {
        const daysOverdue = getDaysOverdue(invoice.due_date, invoice.status);
        const upiLink = `upi://pay?pa=${settings.upi_vpa}&pn=${encodeURIComponent(
          settings.creator_display_name
        )}&am=${invoice.total_amount}&tn=INV%20${invoice.invoice_number}`;

        const message = `Hi ${client.name},

This is a friendly reminder that Invoice ${invoice.invoice_number} for ${currency(
          invoice.total_amount
        )} is ${
          daysOverdue > 0
            ? `${daysOverdue} days overdue`
            : `due on ${new Date(invoice.due_date).toLocaleDateString()}`
        }.

Please make the payment at your earliest convenience.

UPI Link: ${upiLink}

Thank you!`;

        const whatsappUrl = `https://wa.me/${client.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
          message
        )}`;
        window.open(whatsappUrl, "_blank");

        await update_reminder(pendingReminder.id, { status: "sent" });

        await create_message_log({
          related_type: "invoice",
          related_id: invoice.id,
          channel: "whatsapp",
          template_used: "reminder_sent",
          outcome: "sent",
        });

        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.REMINDERS });
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.MESSAGES });

        toast({ title: "Reminder sent successfully" });
        celebrate("reminder_sent");
      } else {
        toast({ title: "No pending reminders for this invoice", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error sending reminder", variant: "destructive" });
    }
  };

  const handleSendInvoice = async (invoice: any) => {
    try {
      // Change status to sent
      await update_invoice(invoice.id, { status: "sent" });

      // Create follow-up reminders if missing  
      const existingReminders = await reminders_by_invoice(invoice.id);
      if (existingReminders.length === 0) {
        const dueDate = new Date(invoice.due_date);
        const reminderDate = new Date(dueDate.getTime() + 24 * 60 * 60 * 1000); // 1 day after due
        
        await create_reminder({
          invoice_id: invoice.id,
          scheduled_at: reminderDate.toISOString(),
          channel: "whatsapp",
          status: "pending"
        });
      }

      // Add message log
      await create_message_log({
        related_type: "invoice",
        related_id: invoice.id,
        channel: "whatsapp",
        template_used: "invoice_sent",
        outcome: "sent"
      });

      await invalidateInvoiceCaches(queryClient);
      
      toast({ title: "Invoice sent successfully" });
      celebrate("invoice_sent");
    } catch {
      toast({ title: "Error sending invoice", variant: "destructive" });
    }
  };

  const handlePreview = async (invoice: any) => {
    try {
      const fullInvoiceData = await invoice_with_items(invoice.id);
      setSelectedPreviewInvoice(fullInvoiceData);
      setShowPreviewModal(true);
    } catch {
      toast({ title: "Error loading invoice data", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="HustleHub — Invoices" description="Manage all your invoices with filtering and search capabilities." />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Button onClick={() => navigate("/invoices/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
              </TabsList>

              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
            </div>

            <TabsContent value={activeTab} className="space-y-4">
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

                    return (
                      <TableRow key={invoice.id} data-testid={`invoice-row-${invoice.id}`}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{clientName(invoice.client_id)}</TableCell>
                        <TableCell className="text-right">{currency(invoice.total_amount)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge>
                        </TableCell>
                        <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {daysOverdue > 0 && invoice.status !== "paid" ? (
                            <Badge variant="destructive" className="text-xs">
                              {daysOverdue}d overdue
                            </Badge>
                          ) : invoice.status === "paid" ? (
                            <Badge variant="secondary" className="text-xs">Paid</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {Math.abs(daysOverdue)}d left
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0" data-testid="invoice-menu-trigger">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                data-testid="invoice-menu-preview"
                                onClick={() => handlePreview(invoice)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                              </DropdownMenuItem>

                              {invoice.status !== "paid" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setPaidDate(new Date().toISOString().split("T")[0]);
                                    setShowMarkPaidModal(true);
                                  }}
                                >
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}

                              {(invoice.status === "sent" || invoice.status === "overdue") && (
                                <DropdownMenuItem onClick={() => handleSendReminder(invoice)}>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Send Reminder
                                </DropdownMenuItem>
                              )}

                              {invoice.status === "draft" && (
                                <DropdownMenuItem
                                  data-testid="invoice-menu-edit"
                                  onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}

                              {invoice.status === "draft" && (
                                <DropdownMenuItem onClick={() => handleSendInvoice(invoice)}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Send Invoice
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Mark as Paid Modal */}
      <Dialog open={showMarkPaidModal} onOpenChange={setShowMarkPaidModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Invoice as Paid</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="paidDate">Payment Date *</Label>
              <Input
                id="paidDate"
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="utrReference">UTR Reference (Optional)</Label>
              <Input
                id="utrReference"
                placeholder="Enter UTR number"
                value={utrReference}
                onChange={(e) => setUtrReference(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMarkPaidModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleMarkPaid} disabled={!paidDate}>
                Mark as Paid
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Preview Modal */}
      {selectedPreviewInvoice && (
        <InvoicePreviewModal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedPreviewInvoice(null);
          }}
          invoice={selectedPreviewInvoice}
        />
      )}
    </div>
  );
}
