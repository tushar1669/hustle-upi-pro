import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { invoices_all, clients_all, settings_one, create_reminder, create_message_log, client_detail } from "@/data/collections";
import { useToast } from "@/hooks/use-toast";
import { invalidateTaskCaches } from "@/hooks/useCache";

interface QuickFollowupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickFollowupModal({ isOpen, onClose }: QuickFollowupModalProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [suggestedTime, setSuggestedTime] = useState("20:30");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices = [] } = useQuery({ queryKey: ["invoices_all"], queryFn: invoices_all });
  const { data: clients = [] } = useQuery({ queryKey: ["clients_all"], queryFn: clients_all });
  const { data: settings } = useQuery({ queryKey: ["settings_one"], queryFn: settings_one });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInvoiceId) {
      toast({ title: "Please select an invoice", variant: "destructive" });
      return;
    }

    const selectedInvoice = eligibleInvoices.find((inv: any) => inv.id === selectedInvoiceId);
    if (!selectedInvoice) return;

    try {
      // Calculate scheduled time (2 hours from now as default)
      const scheduledAt = new Date();
      scheduledAt.setHours(scheduledAt.getHours() + 2);
      
      // If suggested time is provided, use it for today if it's future, otherwise tomorrow
      if (suggestedTime) {
        const [hours, minutes] = suggestedTime.split(':').map(Number);
        const suggestedDate = new Date();
        suggestedDate.setHours(hours, minutes, 0, 0);
        
        // If the suggested time is in the past today, schedule for tomorrow
        if (suggestedDate <= new Date()) {
          suggestedDate.setDate(suggestedDate.getDate() + 1);
        }
        scheduledAt.setTime(suggestedDate.getTime());
      }

      // Create the reminder
      await create_reminder({
        invoice_id: selectedInvoiceId,
        channel: channel,
        scheduled_at: scheduledAt.toISOString(),
        status: 'pending'
      });

      // Log the reminder creation
      await create_message_log({
        related_type: 'invoice',
        related_id: selectedInvoiceId,
        channel: channel,
        template_used: 'followup_scheduled',
        outcome: 'scheduled'
      });

      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["message_log_recent"] });
      queryClient.invalidateQueries({ queryKey: ["v_dashboard_metrics"] });

      toast({ title: "Follow-up reminder scheduled successfully" });
      onClose();
      setSelectedInvoiceId("");
      setChannel("whatsapp");
      setSuggestedTime("20:30");
    } catch (error: any) {
      toast({ title: "Error scheduling follow-up", description: error.message, variant: "destructive" });
    }
  };

  const currency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Follow-up Reminder</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="time">Suggested Time</Label>
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
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Reminder will be scheduled for the next occurrence of the selected time.</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedInvoiceId}>
              Schedule Follow-up
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}