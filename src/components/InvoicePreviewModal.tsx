import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Download, Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { settings_one, clients_all, items_by_invoice } from "@/data/collections";

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

export default function InvoicePreviewModal({ isOpen, onClose, invoice }: InvoicePreviewModalProps) {
  const { data: settings } = useQuery({ queryKey: ["settings_one"], queryFn: settings_one });
  const { data: clients = [] } = useQuery({ queryKey: ["clients_all"], queryFn: clients_all });
  const { data: items = [] } = useQuery({ 
    queryKey: ["invoice_items", invoice?.id], 
    queryFn: () => items_by_invoice(invoice?.id),
    enabled: !!invoice?.id
  });

  if (!invoice) return null;

  const client = clients.find((c: any) => c.id === invoice.client_id);
  const currency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate PDF using browser's print to PDF functionality
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${invoice.invoice_number}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .invoice-header { border-bottom: 2px solid #17B897; padding-bottom: 20px; margin-bottom: 20px; }
              .invoice-logo { max-height: 60px; margin-bottom: 10px; }
              .invoice-title { color: #17B897; font-size: 24px; font-weight: bold; }
              .invoice-details { margin: 20px 0; }
              .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .invoice-table th { background-color: #f8f9fa; }
              .invoice-summary { text-align: right; margin-top: 20px; }
              .total-amount { font-size: 18px; font-weight: bold; color: #17B897; }
            </style>
          </head>
          <body>
            <div class="invoice-header">
              ${(settings as any)?.logo_url ? `<img src="${(settings as any).logo_url}" alt="Logo" class="invoice-logo" />` : `<img src="/assets/Logo_hustlehub.png" alt="HustleHub" class="invoice-logo" />`}
              <div class="invoice-title">INVOICE</div>
              <div><strong>Invoice #:</strong> ${invoice.invoice_number}</div>
              <div><strong>Date:</strong> ${new Date(invoice.issue_date).toLocaleDateString()}</div>
              <div><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</div>
            </div>
            
            <div class="invoice-details">
              <div><strong>Bill To:</strong></div>
              <div>${client?.name || 'Unknown Client'}</div>
              ${client?.email ? `<div>${client.email}</div>` : ''}
              ${client?.whatsapp ? `<div>Phone: ${client.whatsapp}</div>` : ''}
              ${client?.gstin ? `<div>GSTIN: ${client.gstin}</div>` : ''}
            </div>

            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item: any) => `
                  <tr>
                    <td>${item.title}</td>
                    <td>${item.qty}</td>
                    <td>${currency(item.rate)}</td>
                    <td>${currency(item.amount)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="invoice-summary">
              <div><strong>Subtotal:</strong> ${currency(invoice.subtotal)}</div>
              <div><strong>GST (${settings?.default_gst_percent || 18}%):</strong> ${currency(invoice.gst_amount)}</div>
              <div class="total-amount"><strong>Total Amount:</strong> ${currency(invoice.total_amount)}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle>Invoice Preview</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 print:p-8">
          {/* Invoice Header */}
          <div className="border-b-2 border-primary pb-6">
            <div className="mb-4">
              <img 
                src={(settings as any)?.logo_url || "/assets/Logo_hustlehub.png"} 
                alt="Company Logo" 
                className="h-16"
              />
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-primary">INVOICE</h1>
                <div className="mt-2 space-y-1 text-sm">
                  <div><span className="font-medium">Invoice #:</span> {invoice.invoice_number}</div>
                  <div><span className="font-medium">Date:</span> {new Date(invoice.issue_date).toLocaleDateString()}</div>
                  <div><span className="font-medium">Due Date:</span> {new Date(invoice.due_date).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={invoice.status === 'paid' ? 'secondary' : invoice.status === 'overdue' ? 'destructive' : 'default'}>
                  {invoice.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div>
            <h3 className="font-medium mb-2">Bill To:</h3>
            <div className="text-sm space-y-1">
              <div className="font-medium">{client?.name || 'Unknown Client'}</div>
              {client?.email && <div>{client.email}</div>}
              {client?.whatsapp && <div>Phone: {client.whatsapp}</div>}
              {client?.gstin && <div>GSTIN: {client.gstin}</div>}
            </div>
          </div>

          {/* Items Table */}
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Description</th>
                    <th className="text-center p-3 font-medium w-20">Qty</th>
                    <th className="text-right p-3 font-medium w-24">Rate</th>
                    <th className="text-right p-3 font-medium w-24">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, index: number) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                      <td className="p-3">{item.title}</td>
                      <td className="p-3 text-center">{item.qty}</td>
                      <td className="p-3 text-right">{currency(item.rate)}</td>
                      <td className="p-3 text-right font-medium">{currency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{currency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST ({settings?.default_gst_percent || 18}%):</span>
                <span>{currency(invoice.gst_amount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-lg font-bold text-primary">
                <span>Total Amount:</span>
                <span>{currency(invoice.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          {invoice.status === 'paid' && invoice.paid_date && (
            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground">
                <div><span className="font-medium">Paid on:</span> {new Date(invoice.paid_date).toLocaleDateString()}</div>
                {invoice.utr_reference && (
                  <div><span className="font-medium">UTR Reference:</span> {invoice.utr_reference}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}