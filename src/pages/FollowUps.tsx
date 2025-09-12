import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Send, MessageSquare, Mail, TrendingUp, Filter, Calendar, X, Search, CalendarDays } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  invoices_all, 
  clients_all, 
  message_log_recent, 
  settings_one, 
  reminders_all,
  reminders_by_filters,
  reminders_update_status,
  reminder_reschedule,
  message_log_insert,
  bulk_update_reminders,
  create_message_log,
  update_reminder
} from "@/data/collections";
import { sendReminderViaWhatsApp, sendReminderViaEmail } from "@/lib/reminderActions";
import { useToast } from "@/hooks/use-toast";
import { useCelebrationContext } from "@/components/CelebrationProvider";
import { buildInvoiceReminderText, formatINR, buildWhatsAppUrl, sanitizePhoneForWhatsApp } from "@/services/payments";
import { FollowUpPreviewDrawer } from "@/components/FollowUpPreviewDrawer";
import { RescheduleDialog } from "@/components/RescheduleDialog";
import QuickFollowupModal from "@/components/followups/QuickFollowupModal";
import { formatDistanceToNow, format } from "date-fns";
import { CACHE_KEYS, invalidateTaskCaches, invalidateInvoiceCaches } from "@/hooks/useCache";

const currency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

type StatusFilter = ("pending" | "sent" | "skipped")[];
type ChannelFilter = ("whatsapp" | "email")[];
type WhenFilter = 'all' | 'today' | 'next_7_days' | 'overdue';

interface Filters {
  status: StatusFilter;
  channel: ChannelFilter;
  when: WhenFilter;
  client: string;
}

export default function FollowUps() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({ queryKey: ["invoices_all"], queryFn: invoices_all });
  const { data: clients = [], isLoading: clientsLoading } = useQuery({ queryKey: ["clients_all"], queryFn: clients_all });
  const { data: messageLog = [] } = useQuery({ queryKey: ["message_log_recent"], queryFn: message_log_recent });
  const { data: settings } = useQuery({ queryKey: ["settings_one"], queryFn: settings_one });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { celebrate } = useCelebrationContext();
  
  // Initialize filters from URL params
  const defaultFilters: Filters = {
    status: (searchParams.get('status')?.split(',').filter(Boolean) as StatusFilter) || ['pending'],
    channel: (searchParams.get('channel')?.split(',').filter(Boolean) as ChannelFilter) || [],
    when: (searchParams.get('when') as WhenFilter) || 'next_7_days',
    client: searchParams.get('client') || ''
  };

  // State for filters and modals
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selectedReminders, setSelectedReminders] = useState<Set<string>>(new Set());
  const [previewDrawer, setPreviewDrawer] = useState<{ 
    isOpen: boolean; 
    reminder?: any; 
    invoice?: any; 
    client?: any; 
    settings?: any;
    composed?: { message: string; upiIntent: string };
  }>({ isOpen: false });
  const [rescheduleDialog, setRescheduleDialog] = useState<{ 
    isOpen: boolean; 
    reminder?: any; 
    bulkMode?: boolean;
  }>({ isOpen: false });
  const [quickFollowupModal, setQuickFollowupModal] = useState(false);
  const [quickReschedulePopover, setQuickReschedulePopover] = useState<{ isOpen: boolean; reminder?: any }>({ isOpen: false });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.status.length > 0) params.set('status', filters.status.join(','));
    if (filters.channel.length > 0) params.set('channel', filters.channel.join(','));
    if (filters.when !== 'next_7_days') params.set('when', filters.when);
    if (filters.client) params.set('client', filters.client);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Query reminders with filters
  const { data: allReminders = [], isLoading: remindersLoading, error: remindersError } = useQuery({ 
    queryKey: ["reminders_by_filters", filters], 
    queryFn: () => reminders_by_filters(filters)
  });

  // Helper functions
  const findInvoice = (id: string) => invoices.find((i: any) => i.id === id);
  const findClient = (invoiceId: string) => {
    const inv = findInvoice(invoiceId);
    return inv ? clients.find((c: any) => c.id === inv.client_id) : null;
  };

  // Use filtered reminders directly from the query
  const filteredReminders = useMemo(() => {
    return allReminders.filter((reminder: any) => {
      // Only show reminders for sent/overdue invoices  
      const invoice = reminder.invoices;
      return invoice && ['sent', 'overdue'].includes(invoice.status);
    });
  }, [allReminders]);

  // KPIs
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  
  const remindersDueToday = filteredReminders.filter((r: any) => 
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
           invoice.paid_at && 
           new Date(invoice.paid_at) <= new Date(new Date(reminder.sent_at).getTime() + 7 * 24 * 60 * 60 * 1000);
  }).length;
  const responseRate = sentThisWeek > 0 ? 
    Math.round((paidAfterReminder / sentThisWeek) * 100) : 0;

  // Helper functions for bulk actions
  const getSelectedPendingReminders = () => {
    return filteredReminders.filter((r: any) => 
      selectedReminders.has(r.id) && r.status === 'pending'
    );
  };

  const invalidateCaches = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.REMINDERS });
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.MESSAGES });
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DASHBOARD });
    queryClient.invalidateQueries({ queryKey: ["reminders_by_filters"] });
  }, [queryClient]);

  // Action handlers
  const handleSendNow = async (reminder: any, skipPreview = false) => {
    if (!skipPreview) {
      const inv = reminder.invoices || findInvoice(reminder.invoice_id);
      const cli = inv?.clients?.whatsapp ? inv.clients : clients.find((c:any) => c.id === inv?.client_id);
      if (!inv || !cli) return;
      
      // Generate composed message and UPI intent
      const composed = buildInvoiceReminderText({
        clientName: cli.name,
        invoiceNumber: inv.invoice_number,
        amountINR: inv.total_amount,
        dueDateISO: inv.due_date,
        status: inv.status,
        upiVpa: settings?.upi_vpa || "",
        businessName: settings?.creator_display_name || "HustleHub"
      });
      
      setPreviewDrawer({ 
        isOpen: true, 
        reminder, 
        invoice: inv, 
        client: cli,
        settings,
        composed
      });
      return;
    }

    try {
      // Update reminder status to sent
      await reminders_update_status(reminder.id, 'sent');
      
      // Log the action
      await create_message_log({
        related_type: 'invoice',
        related_id: reminder.invoice_id,
        channel: reminder.channel,
        template_used: 'payment_reminder',
        outcome: 'simulated'
      });

      celebrate('reminder_sent');
      invalidateCaches();
      toast({ title: "Reminder sent (simulated)" });
    } catch (error: any) {
      toast({
        title: "Error sending reminder",
        description: error?.message ?? "Something went wrong",
        variant: "destructive"
      });
    }
  };

  const [sending, setSending] = useState(false);

  const handleConfirmSend = async (customMessage?: string) => {
    const { reminder, invoice, client } = previewDrawer;
    if (!reminder || !invoice || !client) return;

    setSending(true);
    try {
      // Handle different channels
      if (reminder.channel === 'email') {
        await sendReminderViaEmail(reminder);
      } else if (customMessage) {
        if (!client.whatsapp) {
          toast({ title: "Client has no WhatsApp number", variant: "destructive" });
          return;
        }
        
        const url = buildWhatsAppUrl({ 
          phone: sanitizePhoneForWhatsApp(client.whatsapp), 
          text: customMessage 
        });
        window.open(url, "_blank");
        
        // Update reminder status and log
        await reminders_update_status(reminder.id, 'sent');
        await create_message_log({
          related_type: 'invoice',
          related_id: invoice.id,
          channel: 'whatsapp',
          template_used: 'reminder_sent',
          outcome: 'sent'
        });
      } else {
        await sendReminderViaWhatsApp(reminder);
      }
      
      toast({ title: "Reminder sent" });
      setPreviewDrawer({ isOpen: false });
      // Invalidate data used by the page/QA
      queryClient.invalidateQueries({ queryKey: ["all_reminders"] });
      queryClient.invalidateQueries({ queryKey: ["message_log_recent"] });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.REMINDERS });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.MESSAGES });
    } catch (e: any) {
      toast({ title: "Error sending reminder", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleSkip = async (reminder: any) => {
    try {
      await reminders_update_status(reminder.id, 'skipped');
      
      // Log the skip action
      await create_message_log({
        related_type: 'invoice',
        related_id: reminder.invoice_id,
        channel: reminder.channel,
        template_used: 'reminder_skipped',
        outcome: 'skipped_by_user'
      });

      invalidateCaches();
      toast({ title: "Reminder skipped" });
    } catch (error: any) {
      toast({
        title: "Error skipping reminder",
        description: error?.message ?? "Something went wrong",
        variant: "destructive"
      });
    }
  };

  const handleReschedule = (reminder?: any, bulkMode = false) => {
    setRescheduleDialog({ isOpen: true, reminder, bulkMode });
  };

  const handleConfirmReschedule = async (newDateTime: string) => {
    const { reminder, bulkMode } = rescheduleDialog;
    
    try {
      if (bulkMode) {
        const selectedPending = getSelectedPendingReminders();
        if (selectedPending.length === 0) return;
        
        await bulk_update_reminders(
          selectedPending.map(r => r.id),
          { scheduled_at: newDateTime, status: 'pending' }
        );
        
        setSelectedReminders(new Set());
        toast({ title: `${selectedPending.length} reminders rescheduled` });
      } else if (reminder) {
        await reminder_reschedule(reminder.id, newDateTime);
        toast({ title: "Reminder rescheduled" });
      }
      
      invalidateCaches();
      setRescheduleDialog({ isOpen: false });
    } catch (error: any) {
      toast({
        title: "Error rescheduling reminder",
        description: error?.message ?? "Something went wrong",
        variant: "destructive"
      });
    }
  };

  // Quick reschedule handlers
  const handleQuickReschedule = async (reminder: any, daysToAdd: number) => {
    try {
      const currentDate = new Date(reminder.scheduled_at);
      const newDate = new Date(currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      
      await update_reminder(reminder.id, { scheduled_at: newDate.toISOString() });
      invalidateCaches();
      
      const friendlyDate = newDate.toLocaleDateString('en-IN', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
      
      toast({ title: `Rescheduled to ${friendlyDate}` });
      setQuickReschedulePopover({ isOpen: false });
    } catch (error: any) {
      toast({
        title: "Error rescheduling reminder",
        description: error?.message ?? "Something went wrong",
        variant: "destructive"
      });
    }
  };

  const handleQuickRescheduleCustom = async (reminder: any, dateString: string) => {
    try {
      const currentDate = new Date(reminder.scheduled_at);
      const newDate = new Date(dateString);
      // Keep the same time, just change the date
      newDate.setHours(currentDate.getHours(), currentDate.getMinutes());
      
      await update_reminder(reminder.id, { scheduled_at: newDate.toISOString() });
      invalidateCaches();
      
      const friendlyDate = newDate.toLocaleDateString('en-IN', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
      
      toast({ title: `Rescheduled to ${friendlyDate}` });
      setQuickReschedulePopover({ isOpen: false });
    } catch (error: any) {
      toast({
        title: "Error rescheduling reminder",
        description: error?.message ?? "Something went wrong",
        variant: "destructive"
      });
    }
  };

  // Bulk action handlers
  const handleBulkSendNow = async () => {
    const selectedPending = getSelectedPendingReminders();
    if (selectedPending.length === 0) return;

    try {
      // Update all to sent status
      await bulk_update_reminders(
        selectedPending.map(r => r.id),
        { status: 'sent' }
      );

      // Log actions for each
      await Promise.all(
        selectedPending.map(reminder =>
          create_message_log({
            related_type: 'invoice',
            related_id: reminder.invoice_id,
            channel: reminder.channel,
            template_used: 'payment_reminder',
            outcome: 'simulated'
          })
        )
      );

      setSelectedReminders(new Set());
      celebrate('reminder_sent');
      invalidateCaches();
      toast({ title: `${selectedPending.length} reminders sent (simulated)` });
    } catch (error: any) {
      toast({
        title: "Error sending reminders",
        description: error?.message ?? "Something went wrong",
        variant: "destructive"
      });
    }
  };

  const handleBulkSkip = async () => {
    const selectedPending = getSelectedPendingReminders();
    if (selectedPending.length === 0) return;

    try {
      await bulk_update_reminders(
        selectedPending.map(r => r.id),
        { status: 'skipped' }
      );

      // Log skip actions
      await Promise.all(
        selectedPending.map(reminder =>
          create_message_log({
            related_type: 'invoice',
            related_id: reminder.invoice_id,
            channel: reminder.channel,
            template_used: 'reminder_skipped',
            outcome: 'skipped_by_user'
          })
        )
      );

      setSelectedReminders(new Set());
      invalidateCaches();
      toast({ title: `${selectedPending.length} reminders skipped` });
    } catch (error: any) {
      toast({
        title: "Error skipping reminders",
        description: error?.message ?? "Something went wrong",
        variant: "destructive"
      });
    }
  };

  const getStage = (reminder: any, invoice: any) => {
    const daysOverdue = Math.ceil((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24));
    return daysOverdue <= 7 ? 'gentle' : daysOverdue <= 14 ? 'professional' : 'firm';
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
    setFilters({
      status: ['pending'],
      channel: [],
      when: 'next_7_days',
      client: ''
    });
  };

  const updateFilters = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleSelection = (reminderId: string, isSelected: boolean) => {
    setSelectedReminders(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(reminderId);
      } else {
        newSet.delete(reminderId);
      }
      return newSet;
    });
  };

  const selectAll = (isSelected: boolean) => {
    if (isSelected) {
      const pendingIds = filteredReminders
        .filter(r => r.status === 'pending')
        .map(r => r.id);
      setSelectedReminders(new Set(pendingIds));
    } else {
      setSelectedReminders(new Set());
    }
  };

  const hasSelection = selectedReminders.size > 0;
  const allPendingSelected = filteredReminders
    .filter(r => r.status === 'pending')
    .every(r => selectedReminders.has(r.id));

  // Show loading state
  if (invoicesLoading || clientsLoading || remindersLoading) {
    return (
      <div className="space-y-6">
        <SEO title="HustleHub — Follow-ups" description="Automated follow-ups and payment reminders overview." />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Follow-ups Worklist</h1>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (remindersError) {
    return (
      <div className="space-y-6">
        <SEO title="HustleHub — Follow-ups" description="Automated follow-ups and payment reminders overview." />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Follow-ups Worklist</h1>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-destructive font-medium mb-2">
              Error loading follow-ups
            </div>
            <p className="text-muted-foreground mb-4">
              There was a problem loading your follow-ups. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <SEO title="HustleHub — Follow-ups" description="Automated follow-ups and payment reminders overview." />
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Follow-ups Worklist</h1>
        <div className="flex gap-2">
          <Button onClick={() => setQuickFollowupModal(true)} className="gap-2" data-testid="btn-open-reminder-preview">
            <Send className="h-4 w-4" />
            Create Follow-up
          </Button>
          <Button variant="outline" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="space-y-2">
                {[
                  { value: 'pending', label: 'Pending' },
                  { value: 'sent', label: 'Sent' },
                  { value: 'skipped', label: 'Skipped' }
                ].map(status => (
                  <label key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      checked={filters.status.includes(status.value as any)}
                      onCheckedChange={(checked) => {
                        const newStatus = checked
                          ? [...filters.status, status.value as any]
                          : filters.status.filter(s => s !== status.value);
                        updateFilters('status', newStatus);
                      }}
                    />
                    <span className="text-sm">{status.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Channel</label>
              <div className="space-y-2">
                {[
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'email', label: 'Email' }
                ].map(channel => (
                  <label key={channel.value} className="flex items-center space-x-2">
                    <Checkbox
                      checked={filters.channel.includes(channel.value as any)}
                      onCheckedChange={(checked) => {
                        const newChannel = checked
                          ? [...filters.channel, channel.value as any]
                          : filters.channel.filter(c => c !== channel.value);
                        updateFilters('channel', newChannel);
                      }}
                    />
                    <span className="text-sm">{channel.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">When</label>
              <Select value={filters.when} onValueChange={(value: WhenFilter) => updateFilters('when', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Times</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="next_7_days">Next 7 days</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Client Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search client name..."
                  value={filters.client}
                  onChange={(e) => updateFilters('client', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {hasSelection && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedReminders.size} reminder{selectedReminders.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleBulkSendNow}>
                  <Send className="h-4 w-4 mr-1" />
                  Send Now
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleReschedule(undefined, true)}>
                  <Calendar className="h-4 w-4 mr-1" />
                  Reschedule
                </Button>
                <Button size="sm" variant="outline" onClick={handleBulkSkip}>
                  Skip All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reminders Worklist */}
      <Card>
        <CardHeader>
          <CardTitle>Reminders ({filteredReminders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allPendingSelected && filteredReminders.filter(r => r.status === 'pending').length > 0}
                    onCheckedChange={selectAll}
                    aria-label="Select all pending reminders"
                  />
                </TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReminders.map((reminder: any) => {
                const invoice = reminder.invoices;
                const client = invoice?.clients;
                
                if (!invoice || !client) return null;

                const scheduledDate = new Date(reminder.scheduled_at);
                const dueTime = formatDistanceToNow(scheduledDate, { addSuffix: true });
                const isOverdue = scheduledDate < new Date();
                const isSelected = selectedReminders.has(reminder.id);
                const canSelect = reminder.status === 'pending';

                return (
                  <TableRow key={reminder.id} className={isSelected ? "bg-muted/50" : ""}>
                    <TableCell className="w-12">
                      {canSelect && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => toggleSelection(reminder.id, !!checked)}
                          aria-label={`Select reminder for ${invoice.invoice_number}`}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="link" className="p-0 h-auto font-mono">
                        {invoice.invoice_number}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className={isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}>
                          {dueTime}
                        </div>
                        <div className="text-xs text-muted-foreground" title={scheduledDate.toISOString()}>
                          {format(scheduledDate, 'MMM d, h:mm a')}
                        </div>
                      </div>
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
                      <Badge variant={getStatusBadgeVariant(reminder.status)}>
                        {reminder.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                     <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                         {reminder.status === 'pending' && (
                           <>
                             {reminder.channel === 'whatsapp' ? (
                               <Button 
                                 size="sm" 
                                 onClick={() => handleSendNow(reminder)}
                                 data-testid="btn-open-reminder-preview"
                                 disabled={!client.whatsapp}
                               >
                                 <MessageSquare className="h-4 w-4 mr-1" />
                                 WhatsApp
                               </Button>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleSendNow(reminder)}
                                      data-testid="btn-open-reminder-preview"
                                      disabled={!client.email}
                                    >
                                      <Mail className="h-4 w-4 mr-1" />
                                      Email
                                    </Button>
                                  </TooltipTrigger>
                                  {!client.email && (
                                    <TooltipContent>
                                      <p>Add an email to this client to enable email reminders</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              )}
                              <Button size="sm" variant="outline" onClick={() => handleSkip(reminder)}>
                                Skip
                              </Button>
                              <Popover 
                                open={quickReschedulePopover.isOpen && quickReschedulePopover.reminder?.id === reminder.id}
                                onOpenChange={(open) => setQuickReschedulePopover({ 
                                  isOpen: open, 
                                  reminder: open ? reminder : undefined 
                                })}
                              >
                                <PopoverTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <CalendarDays className="h-4 w-4 mr-1" />
                                    Reschedule
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64" align="end">
                                  <div className="space-y-3">
                                    <h4 className="font-medium">Quick Reschedule</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => handleQuickReschedule(reminder, 1)}
                                      >
                                        +1 day
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => handleQuickReschedule(reminder, 3)}
                                      >
                                        +3 days
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => handleQuickReschedule(reminder, 7)}
                                      >
                                        +7 days
                                      </Button>
                                    </div>
                                    <div className="pt-2 border-t">
                                      <Label htmlFor="custom-date" className="text-sm font-medium">
                                        Pick date:
                                      </Label>
                                      <Input
                                        id="custom-date"
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            handleQuickRescheduleCustom(reminder, e.target.value);
                                          }
                                        }}
                                        className="mt-1"
                                      />
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <Button size="sm" variant="outline" onClick={() => handleReschedule(reminder)}>
                                <Calendar className="h-4 w-4 mr-1" />
                                Advanced
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
        settings={previewDrawer.settings}
        composed={previewDrawer.composed}
        onConfirm={handleConfirmSend}
      />

      {/* Reschedule Dialog */}
      <RescheduleDialog
        isOpen={rescheduleDialog.isOpen}
        onClose={() => setRescheduleDialog({ isOpen: false })}
        onConfirm={handleConfirmReschedule}
        currentDateTime={rescheduleDialog.reminder?.scheduled_at || new Date().toISOString()}
        reminder={rescheduleDialog.reminder}
        bulkMode={rescheduleDialog.bulkMode}
        selectedCount={rescheduleDialog.bulkMode ? selectedReminders.size : undefined}
      />

      {/* Quick Follow-up Modal */}
      <QuickFollowupModal
        isOpen={quickFollowupModal}
        onClose={() => setQuickFollowupModal(false)}
      />
      </div>
    </TooltipProvider>
  );
}