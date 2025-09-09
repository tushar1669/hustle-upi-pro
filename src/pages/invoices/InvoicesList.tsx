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
import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Eye, Send, MessageSquare, Edit, DollarSign, Copy, Share, CheckCircle2, Circle } from "lucide-react";
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
import { FollowUpPreviewDrawer } from "@/components/FollowUpPreviewDrawer";
import { sendReminderViaWhatsApp, sendReminderViaEmail } from "@/lib/reminderActions";
import { buildInvoiceReminderText, buildInvoiceReminderEmail } from "@/services/payments";

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
  const [showReminderDrawer, setShowReminderDrawer] = useState(false);
  const [selectedReminderInvoice, setSelectedReminderInvoice] = useState<any>(null);
  const [composedMessage, setComposedMessage] = useState<{ message: string; upiIntent: string } | undefined>();
  const [sentFlags, setSentFlags] = useState<Record<string, boolean>>({});

  const clientName = (id: string) => clients.find((c: any) => c.id === id)?.name || "Unknown";

  // Load sent flags from localStorage on component mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('invoice_sent_flags');
      if (stored) {
        setSentFlags(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading sent flags:', error);
    }
  }, []);

  // Save sent flags to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('invoice_sent_flags', JSON.stringify(sentFlags));
    } catch (error) {
      console.error('Error saving sent flags:', error);
    }
  }, [sentFlags]);

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

    setSelectedReminderInvoice(invoice);
    
    // Compose initial message for preview
    const { message, upiIntent } = buildInvoiceReminderText({
      clientName: client.name,
      invoiceNumber: invoice.invoice_number,
      amountINR: invoice.total_amount,
      dueDateISO: invoice.due_date,
      status: invoice.status,
      upiVpa: settings?.upi_vpa || "",
      businessName: settings?.creator_display_name || "HustleHub"
    });
    
    setComposedMessage({ message, upiIntent });
    setShowReminderDrawer(true);
  };

  const handleConfirmReminder = async (customMessage?: string, channel?: 'whatsapp' | 'email') => {
    if (!selectedReminderInvoice) return;
    
    try {
      // Create a temporary reminder object for the action functions
      const tempReminder = {
        id: 'temp',
        invoice_id: selectedReminderInvoice.id,
        channel: channel || 'whatsapp',
        status: 'pending'
      };
      
      if (channel === 'email') {
        await sendReminderViaEmail(tempReminder);
      } else {
        await sendReminderViaWhatsApp(tempReminder);
      }
      
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.REMINDERS });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.MESSAGES });
      
      setShowReminderDrawer(false);
      setSelectedReminderInvoice(null);
      setComposedMessage(undefined);
      
      toast({ title: "Reminder sent successfully" });
      celebrate("reminder_sent");
    } catch (error: any) {
      toast({ 
        title: "Error sending reminder", 
        description: error.message,
        variant: "destructive" 
      });
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

  const toggleSentFlag = (invoiceId: string) => {
    setSentFlags(prev => ({
      ...prev,
      [invoiceId]: !prev[invoiceId]
    }));
    
    const isNowSent = !sentFlags[invoiceId];
    toast({ 
      title: isNowSent ? "Marked as sent" : "Unmarked as sent",
      description: isNowSent ? "Invoice flagged as sent locally" : "Sent flag removed"
    });
  };

  const handleCopyInvoice = async (invoice: any) => {
    try {
      const client = clients.find((c: any) => c.id === invoice.client_id);
      const text = `Invoice ${invoice.invoice_number}\nClient: ${client?.name || 'Unknown'}\nAmount: ${currency(invoice.total_amount)}\nDue: ${new Date(invoice.due_date).toLocaleDateString()}`;
      
      await navigator.clipboard.writeText(text);
      toast({ title: "Invoice details copied to clipboard" });
    } catch (error) {
      toast({ 
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive" 
      });
    }
  };

  const handleShareInvoice = async (invoice: any) => {
    const client = clients.find((c: any) => c.id === invoice.client_id);
    const text = `Invoice ${invoice.invoice_number}\nClient: ${client?.name || 'Unknown'}\nAmount: ${currency(invoice.total_amount)}\nDue: ${new Date(invoice.due_date).toLocaleDateString()}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${invoice.invoice_number}`,
          text: text
        });
      } catch (error) {
        // User cancelled share or error occurred, fallback to copy
        handleCopyInvoice(invoice);
      }
    } else {
      // Fallback to copy
      handleCopyInvoice(invoice);
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
                    const isSentFlagged = sentFlags[invoice.id];

                    return (
                      <TableRow key={invoice.id} data-testid={`invoice-row-${invoice.id}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {invoice.invoice_number}
                            {isSentFlagged && (
                              <Badge variant="secondary" className="text-xs">
                                Sent
                              </Badge>
                            )}
                          </div>
                        </TableCell>
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

                              <DropdownMenuItem onClick={() => toggleSentFlag(invoice.id)}>
                                {isSentFlagged ? (
                                  <>
                                    <Circle className="mr-2 h-4 w-4" />
                                    Undo sent
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Mark as sent
                                  </>
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => handleCopyInvoice(invoice)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy details
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => handleShareInvoice(invoice)}>
                                <Share className="mr-2 h-4 w-4" />
                                Share
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
          data-testid="invoice-preview-modal"
        />
      )}

      {/* Reminder Preview Drawer */}
      {selectedReminderInvoice && (
        <FollowUpPreviewDrawer
          isOpen={showReminderDrawer}
          onClose={() => {
            setShowReminderDrawer(false);
            setSelectedReminderInvoice(null);
            setComposedMessage(undefined);
          }}
          invoice={selectedReminderInvoice}
          client={clients.find((c: any) => c.id === selectedReminderInvoice.client_id)}
          settings={settings}
          composed={composedMessage}
          onConfirm={handleConfirmReminder}
          allowChannelSelection={true}
        />
      )}
    </div>
  );
}
