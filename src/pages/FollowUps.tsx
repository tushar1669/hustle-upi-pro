import React, { useState, useMemo } from "react";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Send, MessageSquare, Mail, TrendingUp, Filter, Calendar, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  invoices_all, 
  clients_all, 
  message_log_recent, 
  settings_one, 
  reminders_all,
  reminders_update_status,
  reminder_reschedule,
  message_log_insert
} from "@/data/collections";
import { useToast } from "@/hooks/use-toast";
import { useCelebrationContext } from "@/components/CelebrationProvider";
import { FollowUpPreviewDrawer } from "@/components/FollowUpPreviewDrawer";
import { RescheduleDialog } from "@/components/RescheduleDialog";
import { formatDistanceToNow } from "date-fns";

const currency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

type StatusFilter = 'all' | 'pending' | 'sent' | 'skipped';
type DueFilter = 'all' | 'today' | 'week' | 'overdue';
type ChannelFilter = 'all' | 'whatsapp' | 'email';

export default function FollowUps() {
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices_all"], queryFn: invoices_all });
  const { data: clients = [] } = useQuery({ queryKey: ["clients_all"], queryFn: clients_all });
  const { data: messageLog = [] } = useQuery({ queryKey: ["message_log_recent"], queryFn: message_log_recent });
  const { data: settings } = useQuery({ queryKey: ["settings_one"], queryFn: settings_one });
  const { data: allReminders = [] } = useQuery({ queryKey: ["reminders_all"], queryFn: reminders_all });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { celebrate } = useCelebrationContext();
  
  // State for filters and modals
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dueFilter, setDueFilter] = useState<DueFilter>('all');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [previewDrawer, setPreviewDrawer] = useState<{ 
    isOpen: boolean; 
    reminder?: any; 
    invoice?: any; 
    client?: any; 
  }>({ isOpen: false });
  const [rescheduleDialog, setRescheduleDialog] = useState<{ 
    isOpen: boolean; 
    reminder?: any; 
  }>({ isOpen: false });

  // Helper functions
  const findInvoice = (id: string) => invoices.find((i: any) => i.id === id);
  const findClient = (invoiceId: string) => {
    const inv = findInvoice(invoiceId);
    return inv ? clients.find((c: any) => c.id === inv.client_id) : null;
  };

  // Compute worklist with filters
  const filteredReminders = useMemo(() => {
    let filtered = allReminders.filter((reminder: any) => {
      const invoice = findInvoice(reminder.invoice_id);
      if (!invoice) return false;
      
      // Only show reminders for sent/overdue invoices  
      if (!['sent', 'overdue'].includes(invoice.status)) return false;
      
      // Apply filters
      if (statusFilter !== 'all' && reminder.status !== statusFilter) return false;
      if (channelFilter !== 'all' && reminder.channel !== channelFilter) return false;
      
      // Due filter
      if (dueFilter !== 'all') {
        const scheduledDate = new Date(reminder.scheduled_at);
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        if (dueFilter === 'today' && scheduledDate.toDateString() !== today.toDateString()) return false;
        if (dueFilter === 'week' && scheduledDate < weekStart) return false;
        if (dueFilter === 'overdue' && scheduledDate >= todayStart) return false;
      }
      
      return true;
    });
    
    // Sort by scheduled_at ascending
    return filtered.sort((a: any, b: any) => 
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );
  }, [allReminders, invoices, statusFilter, dueFilter, channelFilter]);

  // KPIs
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  
  const remindersDueToday = allReminders.filter((r: any) => 
    r.status === 'pending' && r.scheduled_at.split('T')[0] === todayString
  ).length;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sentThisWeek = messageLog.filter(
    m => new Date(m.sent_at) >= weekAgo && m.template_used?.includes('reminder')
  ).length;

  // Calculate response rate
  const recentReminders = messageLog.filter(
    m => m.template_used?.includes('reminder') && new Date(m.sent_at) >= weekAgo
  );
  const paidAfterReminder = recentReminders.filter((reminder: any) => {
    const invoice = invoices.find((i: any) => i.id === reminder.related_id);
    return invoice?.status === "paid" && 
           invoice.paid_date && 
           new Date(invoice.paid_date) <= new Date(new Date(reminder.sent_at).getTime() + 7 * 24 * 60 * 60 * 1000);
  }).length;
  const responseRate = sentThisWeek > 0 ? 
    Math.round((paidAfterReminder / sentThisWeek) * 100) : 0;

  // Action handlers
  const handleSendNow = (reminder: any) => {
    const invoice = findInvoice(reminder.invoice_id);
    const client = findClient(reminder.invoice_id);
    
    if (!invoice || !client) return;
    
    setPreviewDrawer({ 
      isOpen: true, 
      reminder, 
      invoice, 
      client 
    });
  };

  const handleConfirmSend = async () => {
    const { reminder, invoice } = previewDrawer;
    if (!reminder || !invoice) return;

    try {
      // Update reminder status to sent
      await reminders_update_status(reminder.id, 'sent', new Date().toISOString());
      
      // Log the action
      await message_log_insert({
        related_type: 'invoice',
        related_id: invoice.id,
        channel: reminder.channel,
        template_used: 'payment_reminder',
        outcome: 'simulated'
      });

      // Trigger celebration
      celebrate('reminder_sent');
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["reminders_all"] });
      queryClient.invalidateQueries({ queryKey: ["message_log_recent"] });
      
      setPreviewDrawer({ isOpen: false });
      toast({ title: "Reminder sent successfully", description: "Status updated and logged." });
    } catch (error) {
      toast({ title: "Error sending reminder", variant: "destructive" });
    }
  };

  const handleSkip = async (reminder: any) => {
    try {
      await reminders_update_status(reminder.id, 'skipped');
      
      // Log the skip action
      await message_log_insert({
        related_type: 'invoice',
        related_id: reminder.invoice_id,
        channel: reminder.channel,
        template_used: 'reminder_skipped',
        outcome: 'skipped_by_user'
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["reminders_all"] });
      queryClient.invalidateQueries({ queryKey: ["message_log_recent"] });
      
      toast({ title: "Reminder skipped" });
    } catch (error) {
      toast({ title: "Error skipping reminder", variant: "destructive" });
    }
  };

  const handleReschedule = (reminder: any) => {
    setRescheduleDialog({ isOpen: true, reminder });
  };

  const handleConfirmReschedule = async (newDateTime: string) => {
    const { reminder } = rescheduleDialog;
    if (!reminder) return;

    try {
      await reminder_reschedule(reminder.id, newDateTime);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["reminders_all"] });
      
      setRescheduleDialog({ isOpen: false });
      toast({ title: "Reminder rescheduled successfully" });
    } catch (error) {
      toast({ title: "Error rescheduling reminder", variant: "destructive" });
    }
  };

  const getStage = (reminder: any, invoice: any) => {
    const daysOverdue = Math.ceil((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24));
    return daysOverdue <= 3 ? 'gentle' : daysOverdue <= 14 ? 'professional' : 'firm';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'sent': return 'success';
      case 'skipped': return 'secondary';
      default: return 'default';
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setDueFilter('all');
    setChannelFilter('all');
  };

  return (
    <div className="space-y-6">
      <SEO title="HustleHub — Follow-ups" description="Automated follow-ups and payment reminders overview." />
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Follow-ups Worklist</h1>
        <Button variant="outline" onClick={clearFilters} className="gap-2">
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Due</label>
              <Select value={dueFilter} onValueChange={(value: DueFilter) => setDueFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Times</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Channel</label>
              <Select value={channelFilter} onValueChange={(value: ChannelFilter) => setChannelFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminders Worklist */}
      <Card>
        <CardHeader>
          <CardTitle>Reminders ({filteredReminders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReminders.map((reminder: any) => {
                const invoice = findInvoice(reminder.invoice_id);
                const client = findClient(reminder.invoice_id);
                
                if (!invoice || !client) return null;

                const stage = getStage(reminder, invoice);
                const dueTime = formatDistanceToNow(new Date(reminder.scheduled_at), { addSuffix: true });

                return (
                  <TableRow key={reminder.id}>
                    <TableCell>
                      <Button variant="link" className="p-0 h-auto font-mono">
                        {invoice.invoice_number}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <span className={
                        new Date(reminder.scheduled_at) < new Date() 
                          ? "text-destructive font-medium" 
                          : "text-muted-foreground"
                      }>
                        {dueTime}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {reminder.channel === "whatsapp" ? (
                          <MessageSquare className="h-4 w-4" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                        <span className="capitalize">{reminder.channel}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={stage === 'gentle' ? 'secondary' : stage === 'professional' ? 'default' : 'destructive'}>
                        {stage.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(reminder.status)}>
                        {reminder.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {reminder.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => handleSendNow(reminder)}>
                              <Send className="h-4 w-4 mr-1" />
                              Send
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleSkip(reminder)}>
                              Skip
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleReschedule(reminder)}>
                              <Calendar className="h-4 w-4 mr-1" />
                              Reschedule
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredReminders.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg mb-2">
                No pending follow-ups found
              </div>
              <Button variant="outline" asChild>
                <a href="/invoices">View Invoices</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Drawer */}
      <FollowUpPreviewDrawer
        isOpen={previewDrawer.isOpen}
        onClose={() => setPreviewDrawer({ isOpen: false })}
        reminder={previewDrawer.reminder}
        invoice={previewDrawer.invoice}
        client={previewDrawer.client}
        settings={settings}
        onConfirm={handleConfirmSend}
      />

      {/* Reschedule Dialog */}
      <RescheduleDialog
        isOpen={rescheduleDialog.isOpen}
        onClose={() => setRescheduleDialog({ isOpen: false })}
        onConfirm={handleConfirmReschedule}
        currentDateTime={rescheduleDialog.reminder?.scheduled_at || new Date().toISOString()}
        reminder={rescheduleDialog.reminder}
      />
    </div>
  );
}