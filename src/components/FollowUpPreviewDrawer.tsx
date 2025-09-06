import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Mail, Copy, QrCode, RefreshCw, ExternalLink, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { buildInvoiceReminderText, buildInvoiceReminderEmail, buildWhatsAppUrl, buildMailtoUrl, sanitizePhoneForWhatsApp } from "@/services/payments";

interface FollowUpPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reminder?: any;
  invoice: any;
  client: any;
  settings: any;
  composed?: { message: string; upiIntent: string };
  onConfirm: (customMessage?: string, channel?: 'whatsapp' | 'email') => void;
  allowChannelSelection?: boolean;
}

export function FollowUpPreviewDrawer({ 
  isOpen, 
  onClose, 
  reminder, 
  invoice, 
  client, 
  settings,
  composed,
  onConfirm,
  allowChannelSelection = false
}: FollowUpPreviewDrawerProps) {
  const { toast } = useToast();
  const [msg, setMsg] = useState(composed?.message || "");
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'email'>(
    allowChannelSelection ? 'whatsapp' : reminder?.channel || 'whatsapp'
  );

  // Update local message when composed changes
  React.useEffect(() => {
    if (composed?.message) {
      setMsg(composed.message);
    }
  }, [composed]);

  if (!invoice || !client) return null;

  const daysOverdue = Math.ceil((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24));
  const stage = daysOverdue <= 3 ? 'gentle' : daysOverdue <= 14 ? 'professional' : 'firm';
  
  const isWhatsApp = allowChannelSelection ? selectedChannel === 'whatsapp' : reminder?.channel === 'whatsapp';
  const hasWhatsApp = Boolean(sanitizePhoneForWhatsApp(client.whatsapp || ""));
  const hasEmail = Boolean(client.email);
  const hasUpiVpa = Boolean(settings?.upi_vpa);

  const handleRebuildMessage = () => {
    if (!invoice || !client || !settings) return;
    
    if (isWhatsApp) {
      const { message } = buildInvoiceReminderText({
        clientName: client.name,
        invoiceNumber: invoice.invoice_number,
        amountINR: invoice.total_amount,
        dueDateISO: invoice.due_date,
        status: invoice.status,
        upiVpa: settings?.upi_vpa || "",
        businessName: settings?.creator_display_name || "HustleHub"
      });
      setMsg(message);
    } else {
      const { body } = buildInvoiceReminderEmail({
        clientName: client.name,
        invoiceNumber: invoice.invoice_number,
        amountINR: invoice.total_amount,
        dueDateISO: invoice.due_date,
        upiVpa: settings?.upi_vpa || "",
        businessName: settings?.creator_display_name || "HustleHub"
      });
      setMsg(body);
    }
    
    toast({ title: "Message rebuilt from invoice data" });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleOpenUpi = () => {
    if (!composed?.upiIntent) return;
    try {
      window.location.href = composed.upiIntent; // trigger UPI handler in same tab
    } catch {
      // fallback: copy link and toast
      navigator.clipboard.writeText(composed.upiIntent);
      toast({ title: "UPI link copied (fallback)" });
    }
  };

  const handleConfirmSend = () => {
    if (!hasWhatsApp && isWhatsApp) {
      toast({ title: "Client has no WhatsApp number", variant: "destructive" });
      return;
    }
    if (!hasEmail && !isWhatsApp) {
      toast({ title: "Client has no email address", variant: "destructive" });
      return;
    }
    onConfirm(msg, allowChannelSelection ? selectedChannel : reminder?.channel);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:w-[540px] max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {isWhatsApp ? <MessageSquare className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
            {isWhatsApp ? 'WhatsApp' : 'Email'} Reminder Preview
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Alert for missing UPI VPA */}
          {!hasUpiVpa && (
            <Alert data-testid="fu-alert-missing-upi">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                UPI VPA not configured in settings. Payment links may not work properly.
              </AlertDescription>
            </Alert>
          )}

          {/* Alert for missing contact info */}
          {!hasWhatsApp && isWhatsApp && (
            <Alert variant="destructive" data-testid="fu-alert-missing-wa">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Client has no WhatsApp number configured. Cannot send reminder.
              </AlertDescription>
            </Alert>
          )}
          {!hasEmail && !isWhatsApp && (
            <Alert variant="destructive" data-testid="fu-alert-missing-email">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Client has no email address configured. Cannot send reminder.
              </AlertDescription>
            </Alert>
          )}

          {/* Channel Selection */}
          {allowChannelSelection && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Channel Selection</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Select value={selectedChannel} onValueChange={(value: 'whatsapp' | 'email') => setSelectedChannel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp" disabled={!hasWhatsApp}>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        WhatsApp {!hasWhatsApp && "(No number)"}
                      </div>
                    </SelectItem>
                    <SelectItem value="email" disabled={!hasEmail}>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email {!hasEmail && "(No email)"}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Reminder Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Reminder Details</span>
                <Badge variant={stage === 'gentle' ? 'secondary' : stage === 'professional' ? 'default' : 'destructive'}>
                  {stage.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To:</span>
                <span>{client.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoice:</span>
                <span>{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount:</span>
                <span>₹{invoice.total_amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Days Overdue:</span>
                <span className={daysOverdue > 0 ? "text-destructive" : "text-muted-foreground"}>
                  {daysOverdue > 0 ? `${daysOverdue} days` : 'Not overdue'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Helper Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Payment Reference</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-mono">₹{invoice.total_amount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">UPI VPA:</span>
                  <span className="font-mono text-xs">{settings?.upi_vpa || 'Not configured'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editable Message */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Message Content</span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRebuildMessage}
                    data-testid="fu-btn-rebuild"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Rebuild from invoice
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(msg)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Edit your reminder message..."
                className="min-h-[120px] text-sm"
                data-testid="fu-msg-input"
              />
            </CardContent>
          </Card>

          {/* UPI Payment Actions */}
          {hasUpiVpa && composed?.upiIntent && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleOpenUpi}
                  className="w-full"
                  data-testid="btn-upi-open"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open UPI Payment
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSend}
              className="flex-1"
              disabled={(!hasWhatsApp && isWhatsApp) || (!hasEmail && !isWhatsApp)}
              data-testid="btn-confirm-send"
            >
              Confirm & Send
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}