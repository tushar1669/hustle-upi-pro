import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, Send, MessageSquare, Mail, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { invoices_all, clients_all, message_log_recent, settings_one } from "@/data/collections";
import { useToast } from "@/hooks/use-toast";

const currency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function FollowUps() {
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices_all"], queryFn: invoices_all });
  const { data: clients = [] } = useQuery({ queryKey: ["clients_all"], queryFn: clients_all });
  const { data: messageLog = [] } = useQuery({ queryKey: ["message_log_recent"], queryFn: message_log_recent });
  const { data: settings } = useQuery({ queryKey: ["settings_one"], queryFn: settings_one });
  const { toast } = useToast();

  // Get overdue/sent invoices for follow-ups
  const followUpInvoices = invoices.filter((inv: any) => inv.status === "sent" || inv.status === "overdue");

  const findInv = (id: string) => invoices.find((i) => i.id === id);
  const findClient = (invoiceId: string) => {
    const inv = findInv(invoiceId);
    return inv ? clients.find((c) => c.id === inv.client_id) : null;
  };

  // KPIs - simplified for now without actual reminders data
  const today = new Date().toDateString();
  const remindersDueToday = 0; // Placeholder since we don't have reminders query yet

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sentThisWeek = messageLog.filter(
    m => new Date(m.sent_at) >= weekAgo && m.template_used?.includes('reminder')
  ).length;

  // Calculate response rate (invoices paid within 7 days of reminder)
  const recentReminders = messageLog.filter(
    m => m.template_used?.includes('reminder') && new Date(m.sent_at) >= weekAgo
  );
  const paidAfterReminder = recentReminders.filter(reminder => {
    const invoice = invoices.find(i => i.id === reminder.related_id);
    return invoice?.status === "paid" && 
           invoice.paid_date && 
           new Date(invoice.paid_date) <= new Date(new Date(reminder.sent_at).getTime() + 7 * 24 * 60 * 60 * 1000);
  }).length;
  const responseRate = recentReminders.length > 0 ? 
    Math.round((paidAfterReminder / recentReminders.length) * 100) : 0;

  // Mock active reminders for now
  const activeReminders: any[] = [];

  const getDaysOverdue = (invoiceId: string) => {
    const invoice = findInv(invoiceId);
    if (!invoice || invoice.status === "paid") return 0;
    
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    const diffTime = today.getTime() - dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getNextReminderTime = (reminder: any) => {
    const date = new Date(reminder.scheduled_at);
    const time = reminder.suggested_time || "20:00";
    return `${date.toLocaleDateString()} at ${time}`;
  };

  const handleSendReminder = (reminder: any) => {
    const invoice = findInv(reminder.invoice_id);
    const client = findClient(reminder.invoice_id);
    
    if (!invoice || !client) return;

    const isWhatsApp = reminder.channel === "whatsapp";
    const message = `Hi ${client.name}, 
This is a friendly reminder that Invoice ${invoice.invoice_number} for ${currency(invoice.total_amount)} is now ${getDaysOverdue(reminder.invoice_id)} days overdue. 
Please make the payment at your earliest convenience.
UPI ID: ${settings?.upi_vpa || 'your-upi@bank'}
Thank you!`;

    if (isWhatsApp) {
      const whatsappUrl = `https://wa.me/${client.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      const mailtoUrl = `mailto:${client.email}?subject=Payment Reminder - Invoice ${invoice.invoice_number}&body=${encodeURIComponent(message)}`;
      window.open(mailtoUrl, '_blank');
    }

    console.log('Reminder sent for invoice:', invoice.invoice_number);
  };

  return (
    <div className="space-y-6">
      <SEO title="HustleHub — Follow-ups" description="Automated follow-ups and payment reminders overview." />
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Automated Follow-ups</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reminders Due Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{remindersDueToday}</div>
            <p className="text-xs text-muted-foreground">Pending follow-ups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent This Week</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentThisWeek}</div>
            <p className="text-xs text-muted-foreground">Payment reminders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responseRate}%</div>
            <p className="text-xs text-muted-foreground">Paid within 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Follow-ups Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Follow-ups</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Reminder</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeReminders.map((reminder) => {
                const invoice = findInv(reminder.invoiceId);
                const client = findClient(reminder.invoiceId);
                const daysOverdue = getDaysOverdue(reminder.invoiceId);

                if (!invoice || !client) return null;

                return (
                  <TableRow key={reminder.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell className="text-right">{currency(invoice.totalAmount)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={daysOverdue > 7 ? "destructive" : "default"}>
                          {daysOverdue > 0 ? `${daysOverdue} days overdue` : `Due in ${Math.abs(daysOverdue)} days`}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getNextReminderTime(reminder)}
                        <Badge variant="outline" className="ml-2 text-xs">Suggested</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {reminder.channel === "whatsapp" ? (
                          <MessageSquare className="h-4 w-4" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                        <span className="text-sm capitalize">{reminder.channel}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        onClick={() => handleSendReminder(reminder)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Now
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {activeReminders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No pending follow-ups. All caught up!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rules Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Follow-up Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Send first reminder</span>
              <Badge variant="outline">T+3 days</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Send second reminder</span>
              <Badge variant="outline">T+7 days</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Send final reminder</span>
              <Badge variant="outline">T+14 days</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Daily reminders after</span>
              <Badge variant="outline">T+15 days</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quiet Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">No reminders between</span>
              <Badge variant="outline">23:00 - 07:00</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Preferred send time</span>
              <Badge variant="outline">20:00</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Weekend reminders</span>
              <Badge variant="secondary">Enabled</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}