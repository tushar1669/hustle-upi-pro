import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { invoices_all, clients_all, create_reminder, create_message_log, client_detail } from "@/data/collections";
import { useToast } from "@/hooks/use-toast";
import { useCelebrationContext } from "@/components/CelebrationProvider";

interface QuickFollowupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Message templates for preview
const MESSAGE_TEMPLATES = {
  whatsapp: {
    gentle: "Hi {client_name}! 👋 Hope you're doing well. Just a friendly reminder about invoice {invoice_number} for {amount}. Due date was {due_date}. Thanks! 🙏",
    professional: "Dear {client_name}, This is a reminder that invoice {invoice_number} for {amount} was due on {due_date}. Please process payment at your earliest convenience.",
    firm: "URGENT: Payment for invoice {invoice_number} ({amount}) is now {days_overdue} days overdue. Please settle immediately to avoid service disruption."
  },
  email: {
    gentle: "Subject: Friendly Payment Reminder\n\nHi {client_name},\n\nI hope this email finds you well. This is a gentle reminder that invoice {invoice_number} for {amount} was due on {due_date}.\n\nBest regards",
    professional: "Subject: Payment Reminder - Invoice {invoice_number}\n\nDear {client_name},\n\nThis is a reminder that invoice {invoice_number} for {amount} was due on {due_date}. Please process payment at your earliest convenience.\n\nThank you",
    firm: "Subject: URGENT: Overdue Payment - Invoice {invoice_number}\n\nDear {client_name},\n\nPayment for invoice {invoice_number} ({amount}) is now {days_overdue} days overdue. Please settle immediately.\n\nRegards"
  }
};

export default function QuickFollowupModal({ isOpen, onClose }: QuickFollowupModalProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [sendTime, setSendTime] = useState<"now" | "schedule">("now");
  const [suggestedTime, setSuggestedTime] = useState("20:30");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { celebrate } = useCelebrationContext();

  const { data: invoices = [] } = useQuery({ queryKey: ["invoices_all"], queryFn: invoices_all });
  const { data: clients = [] } = useQuery({ queryKey: ["clients_all"], queryFn: clients_all });

  // Filter invoices that can have reminders (sent or overdue)
  const eligibleInvoices = invoices.filter((invoice: any) => 
    invoice.status === 'sent' || invoice.status === 'overdue'
  );

  const getClientName = (invoice: any) => {
    const client = clients.find((c: any) => c.id === invoice.client_id);
    return client?.name || 'Unknown Client';
  };

  const getClientSuggestedTime = async (invoice: any) => {
    try {
      const client = await client_detail(invoice.client_id);
      return client?.suggested_hour || "20:30";
    } catch {
      return "20:30";
    }
  };

  const handleInvoiceSelect = async (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    const invoice = eligibleInvoices.find((inv: any) => inv.id === invoiceId);
    if (invoice) {
      const suggestedHour = await getClientSuggestedTime(invoice);
      setSuggestedTime(suggestedHour);
    }
  };

  const getMessageTemplate = () => {
    if (!selectedInvoiceId) return "";
    
    const invoice = eligibleInvoices.find((inv: any) => inv.id === selectedInvoiceId);
    if (!invoice) return "";
    
    const client = clients.find((c: any) => c.id === invoice.client_id);
    const daysOverdue = Math.ceil((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24));
    
    let stage: 'gentle' | 'professional' | 'firm';
    if (daysOverdue <= 7) stage = 'gentle';
    else if (daysOverdue <= 14) stage = 'professional';
    else stage = 'firm';
    
    const template = MESSAGE_TEMPLATES[channel][stage];
    return template
      .replace('{client_name}', client?.name || 'Client')
      .replace('{invoice_number}', invoice.invoice_number)
      .replace('{amount}', `₹${invoice.total_amount.toLocaleString("en-IN")}`)
      .replace('{due_date}', new Date(invoice.due_date).toLocaleDateString())
      .replace('{days_overdue}', Math.max(0, daysOverdue).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInvoiceId) {
      toast({ title: "Please select an invoice", variant: "destructive" });
      return;
    }

    const selectedInvoice = eligibleInvoices.find((inv: any) => inv.id === selectedInvoiceId);
    if (!selectedInvoice) return;

    try {
      let scheduledAt: Date;
      
      if (sendTime === "now") {
        scheduledAt = new Date();
      } else {
        // Calculate scheduled time
        const [hours, minutes] = suggestedTime.split(':').map(Number);
        scheduledAt = new Date();
        scheduledAt.setHours(hours, minutes, 0, 0);
        
        // If the suggested time is in the past today, schedule for tomorrow
        if (scheduledAt <= new Date()) {
          scheduledAt.setDate(scheduledAt.getDate() + 1);
        }
      }

      // Create the reminder
      await create_reminder({
        invoice_id: selectedInvoiceId,
        channel: channel,
        scheduled_at: scheduledAt.toISOString(),
        status: sendTime === "now" ? 'sent' : 'pending'
      });

      // Log the reminder creation
      await create_message_log({
        related_type: 'invoice',
        related_id: selectedInvoiceId,
        channel: channel,
        template_used: sendTime === "now" ? 'reminder_sent' : 'followup_scheduled',
        outcome: sendTime === "now" ? 'simulated' : 'scheduled'
      });

      // Trigger celebration
      celebrate('reminder_sent');

      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ["reminders_all"] });
      queryClient.invalidateQueries({ queryKey: ["message_log_recent"] });
      queryClient.invalidateQueries({ queryKey: ["v_dashboard_metrics"] });
      queryClient.invalidateQueries({ queryKey: ["invoices_all"] });

      toast({ 
        title: sendTime === "now" ? "Reminder sent (simulated)" : "Follow-up reminder scheduled successfully" 
      });
      onClose();
      setSelectedInvoiceId("");
      setChannel("whatsapp");
      setSendTime("now");
      setSuggestedTime("20:30");
    } catch (error: any) {
      toast({ title: "Error creating follow-up", description: error.message, variant: "destructive" });
    }
  };

  const currency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Follow-up Reminder</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="invoice">Select Invoice *</Label>
            <Select value={selectedInvoiceId} onValueChange={handleInvoiceSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an invoice to follow up on" />
              </SelectTrigger>
              <SelectContent>
                {eligibleInvoices.map((invoice: any) => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{invoice.invoice_number} - {getClientName(invoice)}</span>
                      <div className="ml-2 flex items-center gap-2">
                        <span className="text-sm">{currency(invoice.total_amount)}</span>
                        <Badge variant={invoice.status === 'overdue' ? 'destructive' : 'default'} className="text-xs">
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {eligibleInvoices.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No invoices available for follow-up. Only sent or overdue invoices can have reminders.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="channel">Channel *</Label>
            <Select value={channel} onValueChange={(value: "whatsapp" | "email") => setChannel(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Send Time *</Label>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="now"
                  name="sendTime"
                  value="now"
                  checked={sendTime === "now"}
                  onChange={(e) => setSendTime(e.target.value as "now" | "schedule")}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <Label htmlFor="now">Send now</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="schedule"
                  name="sendTime"
                  value="schedule"
                  checked={sendTime === "schedule"}
                  onChange={(e) => setSendTime(e.target.value as "now" | "schedule")}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <Label htmlFor="schedule">Schedule</Label>
              </div>
            </div>
          </div>

          {sendTime === "schedule" && (
            <div>
              <Label htmlFor="time">Scheduled Time</Label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={suggestedTime}
                  onChange={(e) => setSuggestedTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <Badge variant="outline" className="text-xs">
                  Client suggested time
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Reminder will be scheduled for the next occurrence of the selected time.
              </p>
            </div>
          )}

          {selectedInvoiceId && (
            <div>
              <Label>Message Preview</Label>
              <div className="mt-2 p-3 bg-muted rounded-lg border">
                <p className="text-sm whitespace-pre-wrap font-mono">
                  {getMessageTemplate()}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedInvoiceId}>
              {sendTime === "now" ? "Send Now" : "Schedule Follow-up"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}