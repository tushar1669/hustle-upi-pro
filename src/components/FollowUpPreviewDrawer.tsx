import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Mail, Copy, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FollowUpPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reminder: any;
  invoice: any;
  client: any;
  settings: any;
  onConfirm: () => void;
}

const TEMPLATES = {
  gentle: {
    subject: "Friendly Payment Reminder - Invoice {invoice_number}",
    body: `Hi {client_name},

I hope this message finds you well! 

This is a gentle reminder that Invoice {invoice_number} for {amount} was due on {due_date}. I understand that sometimes invoices can slip through the cracks, so I wanted to reach out as a friendly reminder.

Please let me know if you have any questions about the invoice or if there's anything I can help clarify.

Payment Link: {upi_uri}

Thank you for your business!

Best regards,
{business_name}`
  },
  professional: {
    subject: "Payment Reminder - Invoice {invoice_number}",
    body: `Dear {client_name},

This is a reminder that Invoice {invoice_number} for {amount} was due on {due_date} and remains unpaid.

Please arrange payment at your earliest convenience. If you have already made the payment, please disregard this message and accept our thanks.

For any queries regarding this invoice, please don't hesitate to contact us.

Payment Link: {upi_uri}

Thank you for your prompt attention to this matter.

Best regards,
{business_name}`
  },
  firm: {
    subject: "URGENT: Outstanding Payment - Invoice {invoice_number}",
    body: `Dear {client_name},

This is an urgent reminder regarding overdue Invoice {invoice_number} for {amount}, which was due on {due_date}.

Immediate payment is required to avoid any disruption to our services. Please settle this invoice within 24 hours of receiving this notice.

If payment has already been made, please confirm by replying to this message with the transaction details.

Payment Link: {upi_uri}

We value our business relationship and look forward to resolving this matter promptly.

Best regards,
{business_name}`
  }
};

export function FollowUpPreviewDrawer({ 
  isOpen, 
  onClose, 
  reminder, 
  invoice, 
  client, 
  settings, 
  onConfirm 
}: FollowUpPreviewDrawerProps) {
  const { toast } = useToast();

  if (!reminder || !invoice || !client) return null;

  const daysOverdue = Math.ceil((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24));
  const stage = daysOverdue <= 3 ? 'gentle' : daysOverdue <= 14 ? 'professional' : 'firm';
  const template = TEMPLATES[stage];
  
  const upiUri = `upi://pay?pa=${settings?.upi_vpa}&pn=${encodeURIComponent(settings?.creator_display_name || 'HustleHub')}&am=${invoice.total_amount}&tn=INV%20${invoice.invoice_number}`;
  
  const variables = {
    client_name: client.name,
    invoice_number: invoice.invoice_number,
    amount: `₹${invoice.total_amount.toLocaleString("en-IN")}`,
    due_date: new Date(invoice.due_date).toLocaleDateString(),
    upi_uri: upiUri,
    business_name: settings?.creator_display_name || 'HustleHub'
  };

  const populateTemplate = (text: string) => {
    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    return result;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const subject = populateTemplate(template.subject);
  const body = populateTemplate(template.body);
  const isWhatsApp = reminder.channel === 'whatsapp';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {isWhatsApp ? <MessageSquare className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
            {isWhatsApp ? 'WhatsApp' : 'Email'} Reminder Preview
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
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
                <span>{variables.amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Days Overdue:</span>
                <span className={daysOverdue > 0 ? "text-destructive" : "text-muted-foreground"}>
                  {daysOverdue > 0 ? `${daysOverdue} days` : 'Not overdue'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Message Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Message Content</span>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(isWhatsApp ? body : `${subject}\n\n${body}`)}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {!isWhatsApp && (
                <div className="mb-3">
                  <div className="text-xs text-muted-foreground mb-1">Subject:</div>
                  <div className="text-sm font-medium p-2 bg-muted rounded border-l-2 border-primary">
                    {subject}
                  </div>
                </div>
              )}
              <div className="text-xs text-muted-foreground mb-1">Message:</div>
              <div className="text-sm p-3 bg-muted rounded border-l-2 border-primary whitespace-pre-wrap max-h-48 overflow-y-auto">
                {body}
              </div>
            </CardContent>
          </Card>

          {/* UPI Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">UPI ID:</span>
                  <span className="font-mono">{settings?.upi_vpa}</span>
                </div>
                <div className="text-xs text-muted-foreground break-all">
                  <span className="block mb-1">UPI Link:</span>
                  <code className="bg-muted p-1 rounded text-xs">{upiUri}</code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={onConfirm} 
              className="flex-1"
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