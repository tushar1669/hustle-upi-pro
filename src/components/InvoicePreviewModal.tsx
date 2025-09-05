import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Download, Printer, FileDown, Loader2, Copy, Share2, ExternalLink } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settings_one, clients_all, client_detail, items_by_invoice } from "@/data/collections";
import { generateInvoicePDF, downloadPDF } from "@/lib/pdfGenerator";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { formatINR, buildUpiIntent, buildInvoiceReminderText, buildWhatsAppUrl, sanitizePhoneForWhatsApp } from "@/services/payments";
import { toDataURL } from "qrcode";

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

export default function InvoicePreviewModal({ isOpen, onClose, invoice }: InvoicePreviewModalProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");
  const queryClient = useQueryClient();
  
  const { data: settings } = useQuery({ queryKey: ["settings_one"], queryFn: settings_one });
  const logoSrc =
    settings?.logo_url && settings.logo_url.trim() !== ""
      ? settings.logo_url
      : "/assets/Full_Logo_hustlehub.png";
  const { data: clients = [] } = useQuery({ queryKey: ["clients_all"], queryFn: clients_all });
  const { data: clientDetails } = useQuery({ 
    queryKey: ["client_detail", invoice?.client_id], 
    queryFn: () => client_detail(invoice?.client_id),
    enabled: !!invoice?.client_id
  });
  const { data: items = [] } = useQuery({ 
    queryKey: ["invoice_items", invoice?.id], 
    queryFn: () => items_by_invoice(invoice?.id),
    enabled: !!invoice?.id
  });

  if (!invoice) return null;

  const client = clientDetails || clients.find((c: any) => c.id === invoice.client_id);
  const currency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  // UPI Payment data
  const clientName = invoice?.clients?.name || client?.name || "Client";
  const phoneRaw = invoice?.clients?.whatsapp || client?.whatsapp || "";
  const upiVpa = settings?.upi_vpa || "";
  const bizName = settings?.creator_display_name || "HustleHub";
  const amount = invoice?.total_amount || 0;
  const invNo = invoice?.invoice_number || "—";
  const dueISO = invoice?.due_date || new Date().toISOString().split("T")[0];
  const status = invoice?.status || "draft";
  const upiLink = upiVpa ? buildUpiIntent({ pa: upiVpa, pn: bizName, am: amount, tn: `INV ${invNo}` }) : "";
  const { message } = buildInvoiceReminderText({
    clientName: clientName,
    invoiceNumber: invNo,
    amountINR: amount,
    dueDateISO: dueISO,
    status: status as any,
    upiVpa,
    businessName: bizName
  });

  // Generate QR code
  useEffect(() => {
    if (!upiLink) { 
      setQrUrl(""); 
      return; 
    }
    toDataURL(upiLink, { margin: 1, width: 240 })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [upiLink]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyUpiLink = async () => {
    try {
      await navigator.clipboard.writeText(upiLink);
      toast({
        title: "UPI link copied",
        description: "UPI payment link has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy UPI link.",
        variant: "destructive",
      });
    }
  };

  const handleWhatsAppShare = () => {
    const url = buildWhatsAppUrl({ phone: sanitizePhoneForWhatsApp(phoneRaw), text: message });
    window.open(url, "_blank");
  };

  const handleDownload = async () => {
    try {
      setIsGeneratingPDF(true);
      
      // Check if PDF already exists
      if (invoice.pdf_url) {
        await downloadPDF(invoice.pdf_url, `invoice_${invoice.invoice_number}.pdf`);
        toast({
          title: "PDF Downloaded",
          description: "Invoice PDF has been downloaded successfully.",
        });
        return;
      }

      // Generate new PDF
      const pdfUrl = await generateInvoicePDF(
        invoice,
        client,
        items,
        settings as any
      );

      // Download the PDF
      await downloadPDF(pdfUrl, `invoice_${invoice.invoice_number}.pdf`);
      
      // Invalidate queries to update the invoice with PDF URL
      queryClient.invalidateQueries({ queryKey: ["invoices_all"] });
      queryClient.invalidateQueries({ queryKey: ["invoice_detail", invoice.id] });
      
      toast({
        title: "PDF Generated & Downloaded",
        description: "Invoice PDF has been generated and downloaded successfully.",
      });
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: "Error",
        description: "Failed to generate or download PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="invoice-preview-modal">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle>Invoice Preview</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button 
              data-testid="invoice-pdf-btn"
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : invoice.pdf_url ? (
                <Download className="h-4 w-4 mr-2" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              {isGeneratingPDF ? "Generating..." : invoice.pdf_url ? "Download PDF" : "Generate & Download PDF"}
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
                src={logoSrc}
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

          {/* Business & Client Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-medium mb-3 text-primary border-b border-border pb-2">From:</h3>
              <div className="text-sm space-y-1">
                <div className="font-medium text-base">{(settings as any)?.company_name || (settings as any)?.creator_display_name || 'Business Name'}</div>
                {(settings as any)?.company_address && <div>{(settings as any).company_address}</div>}
                {(settings as any)?.gstin && <div><span className="font-medium">GSTIN:</span> {(settings as any).gstin}</div>}
                {(settings as any)?.upi_vpa && <div><span className="font-medium">UPI:</span> {(settings as any).upi_vpa}</div>}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-3 text-primary border-b border-border pb-2">Bill To:</h3>
              <div className="text-sm space-y-1">
                <div className="font-medium text-base">{client?.name || 'Unknown Client'}</div>
                {client?.email && <div>{client.email}</div>}
                {client?.whatsapp && <div>Phone: {client.whatsapp}</div>}
                {client?.address && <div>{client.address}</div>}
                {client?.gstin && <div><span className="font-medium">GSTIN:</span> {client.gstin}</div>}
              </div>
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

          {/* UPI Payment Section */}
          <Card data-testid="invoice-preview-card" className="border-2 border-primary/20">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-primary">Pay via UPI</h3>
              
              {!upiVpa ? (
                <Alert>
                  <AlertDescription>
                    Add UPI VPA in Settings to enable quick pay links.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Pay to:</span> {upiVpa}
                  </div>
                  
                  <div className="text-xl font-bold text-primary">
                    {formatINR(amount)}
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      asChild
                      data-testid="btn-upi-open"
                      className="flex-1 min-w-[120px]"
                    >
                      <a href={upiLink}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open UPI App
                      </a>
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={handleCopyUpiLink}
                      data-testid="btn-upi-copy"
                      className="flex-1 min-w-[120px]"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy UPI Link
                    </Button>
                    
                    {phoneRaw && (
                      <Button 
                        variant="outline"
                        onClick={handleWhatsAppShare}
                        data-testid="btn-wa-share-invoice"
                        className="flex-1 min-w-[120px]"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share on WhatsApp
                      </Button>
                    )}
                  </div>
                  
                  {qrUrl && (
                    <div className="flex justify-center pt-4">
                      <div className="bg-white p-4 rounded-lg border">
                        <img 
                          src={qrUrl} 
                          alt="UPI QR Code" 
                          data-testid="upi-qr"
                          className="w-60 h-60"
                        />
                        <p className="text-center text-sm text-muted-foreground mt-2">
                          Scan to pay with any UPI app
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer Message */}
          {(settings as any)?.footer_message && (
            <div className="border-t pt-4 text-center text-muted-foreground italic">
              {(settings as any).footer_message}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}