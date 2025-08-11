import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";
import { Plus, Trash2, FileText, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

const currency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

interface LineItem {
  id: string;
  title: string;
  qty: number;
  rate: number;
  amount: number;
}

export default function CreateInvoice() {
  const navigate = useNavigate();
  const settings = useAppStore((s) => s.settings);
  const clients = useAppStore((s) => s.clients);
  const projects = useAppStore((s) => s.projects);
  const addInvoiceDraft = useAppStore((s) => s.addInvoiceDraft);

  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [notes, setNotes] = useState("");
  const [gstEnabled, setGstEnabled] = useState(true);
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", title: "Website Development", qty: 1, rate: 25000, amount: 25000 }
  ]);

  const selectedClient = clients.find(c => c.id === clientId);
  const filteredProjects = projects.filter(p => p.clientId === clientId);

  const invoiceNumber = useMemo(() => {
    const seq = (useAppStore.getState().invoices.length + 1).toString().padStart(4, "0");
    return `${settings.invoicePrefix}-2025-${seq}`;
  }, [settings.invoicePrefix]);

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const gstAmount = gstEnabled ? subtotal * (settings.defaultGst / 100) : 0;
  const totalAmount = subtotal + gstAmount;

  const upiLink = useMemo(() => {
    if (!totalAmount) return "";
    return `upi://pay?pa=${settings.upiVpa}&pn=${encodeURIComponent(settings.displayName)}&am=${totalAmount.toFixed(0)}&tn=INV%20${invoiceNumber}`;
  }, [totalAmount, invoiceNumber, settings.displayName, settings.upiVpa]);

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(items => items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'qty' || field === 'rate') {
          updated.amount = updated.qty * updated.rate;
        }
        return updated;
      }
      return item;
    }));
  };

  const addLineItem = () => {
    const newId = (lineItems.length + 1).toString();
    setLineItems(items => [...items, {
      id: newId,
      title: "",
      qty: 1,
      rate: 0,
      amount: 0
    }]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(items => items.filter(item => item.id !== id));
  };

  const saveDraft = () => {
    if (!clientId) {
      alert("Please select a client");
      return;
    }
    
    const invoiceId = `inv-${Date.now()}`;
    // Create line items for the invoice
    const invoiceItems = lineItems.map(item => ({
      id: `item-${item.id}`,
      invoiceId,
      title: item.title,
      qty: item.qty,
      rate: item.rate,
      amount: item.amount
    }));

    addInvoiceDraft({
      invoiceNumber,
      clientId,
      projectId: projectId || undefined,
      issueDate: new Date().toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      subtotal,
      gstAmount,
      totalAmount,
      status: "draft" as const,
      notes: notes || undefined
    }, invoiceItems);
    
    navigate("/invoices");
  };

  return (
    <div className="space-y-6">
      <SEO title="HustleHub — Create Invoice" description="Create a new invoice with live preview and UPI payment link." />
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create Invoice</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/invoices")}>Cancel</Button>
          <Button variant="outline" onClick={saveDraft}>
            <FileText className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={saveDraft}>
            <Send className="h-4 w-4 mr-2" />
            Save & Send
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* Client & Project Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Client & Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {clientId && (
                <div className="space-y-2">
                  <Label htmlFor="project">Project (Optional)</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineItems.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Label>Item</Label>
                    <Input
                      value={item.title}
                      onChange={(e) => updateLineItem(item.id, 'title', e.target.value)}
                      placeholder="Description"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      value={item.qty}
                      onChange={(e) => updateLineItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-3">
                    <Label>Rate</Label>
                    <Input
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateLineItem(item.id, 'rate', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Amount</Label>
                    <div className="text-sm font-medium py-2">{currency(item.amount)}</div>
                  </div>
                  <div className="col-span-1">
                    {lineItems.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              <Button variant="outline" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={gstEnabled}
                  onCheckedChange={setGstEnabled}
                />
                <Label>Include GST ({settings.defaultGst}%)</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes or terms..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Header */}
              <div className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-primary">HustleHub</h2>
                    <p className="text-sm text-muted-foreground">{settings.displayName}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-semibold">INVOICE</h3>
                    <p className="text-sm">{invoiceNumber}</p>
                    <Badge variant="outline">DRAFT</Badge>
                  </div>
                </div>
              </div>

              {/* Client Info */}
              {selectedClient && (
                <div className="border-b pb-4">
                  <h4 className="font-semibold mb-2">Bill To:</h4>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{selectedClient.name}</p>
                    <p>{selectedClient.address}</p>
                    <p>Phone: {selectedClient.whatsapp}</p>
                    <p>Email: {selectedClient.email}</p>
                    {selectedClient.gstin && <p>GSTIN: {selectedClient.gstin}</p>}
                  </div>
                </div>
              )}

              {/* Line Items */}
              <div className="space-y-2">
                <h4 className="font-semibold">Items:</h4>
                {lineItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.title || "Item"}</p>
                      <p className="text-muted-foreground">{item.qty} × {currency(item.rate)}</p>
                    </div>
                    <div className="font-medium">{currency(item.amount)}</div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{currency(subtotal)}</span>
                </div>
                {gstEnabled && (
                  <div className="flex justify-between text-sm">
                    <span>GST ({settings.defaultGst}%):</span>
                    <span>{currency(gstAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total:</span>
                  <span>{currency(totalAmount)}</span>
                </div>
              </div>

              {notes && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Notes:</h4>
                  <p className="text-sm text-muted-foreground">{notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* UPI Payment */}
          {totalAmount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>UPI Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <QRCodeSVG value={upiLink} size={200} className="mx-auto" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Pay To:</span>
                    <span className="font-medium">{settings.displayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>UPI ID:</span>
                    <span className="font-medium">{settings.upiVpa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">{currency(totalAmount)}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground break-all">
                  {upiLink}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}