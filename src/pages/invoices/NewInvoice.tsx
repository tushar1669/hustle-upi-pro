import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";

export default function NewInvoice() {
  const settings = useAppStore((s) => s.settings);
  const clients = useAppStore((s) => s.clients);

  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [amount, setAmount] = useState(5000);

  const invoiceNumber = useMemo(() => {
    const seq = (useAppStore.getState().invoices.length + 1).toString().padStart(4, "0");
    return `${settings.invoicePrefix}-2025-${seq}`;
  }, [settings.invoicePrefix]);

  const upiLink = useMemo(() => {
    const total = amount * 1.18; // quick GST add for preview
    return `upi://pay?pa=${settings.upiVpa}&pn=${encodeURIComponent(settings.displayName)}&am=${total.toFixed(0)}&tn=INV%20${invoiceNumber}`;
  }, [amount, invoiceNumber, settings.displayName, settings.upiVpa]);

  return (
    <div className="space-y-6">
      <SEO title="HustleHub — Create Invoice" description="Create an invoice with live UPI preview." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="block text-sm">Client</label>
            <select className="w-full border rounded-md p-2 bg-background" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <label className="block text-sm">Amount (subtotal)</label>
            <input type="number" className="w-full border rounded-md p-2 bg-background" value={amount} onChange={(e) => setAmount(parseInt(e.target.value || "0"))} />
          </CardContent>
        </Card>

        <Card data-testid="invoice-preview-card">
          <CardHeader>
            <CardTitle>Preview & UPI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">Invoice #: <span className="font-medium">{invoiceNumber}</span></div>
            <div className="text-sm">Payable To: <span className="font-medium">{settings.displayName}</span></div>
            <div className="text-sm">VPA: <span className="font-medium">{settings.upiVpa}</span></div>
            <div className="flex items-center gap-4 pt-4">
              <QRCodeSVG value={upiLink} size={144} />
              <div className="text-xs break-all">{upiLink}</div>
            </div>
            <div className="pt-4 space-x-2">
              <Button disabled data-testid="btn-save-draft">Create Draft (demo)</Button>
              <Button disabled data-testid="btn-save-send">Save & Send (demo)</Button>
              <Button disabled data-testid="btn-add-line-item">Add Line Item (demo)</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
