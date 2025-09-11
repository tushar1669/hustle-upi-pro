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
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState, useEffect } from "react";
import { Plus, Trash2, FileText, Send, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  settings_one, 
  clients_all, 
  projects_all, 
  invoices_all,
  create_invoice, 
  create_item, 
  create_message_log,
  create_reminder,
  update_invoice
} from "@/data/collections";
import { useToast } from "@/hooks/use-toast";
import { useCelebrationContext } from "@/components/CelebrationProvider";
import AddClientModal from "@/components/AddClientModal";
import AddProjectModal from "@/components/AddProjectModal";
import { CACHE_KEYS, invalidateInvoiceCaches } from "@/hooks/useCache";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { isDemoMode } from "@/integrations/supabase/client";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { celebrate } = useCelebrationContext();
  const { session } = useAuth();

  const { data: settings, isLoading: settingsLoading, error: settingsError } = useQuery({ 
    queryKey: CACHE_KEYS.SETTINGS, 
    queryFn: settings_one 
  });
  const { data: clients = [], refetch: refetchClients } = useQuery({ 
    queryKey: CACHE_KEYS.CLIENTS, 
    queryFn: clients_all 
  });
  const { data: projects = [], refetch: refetchProjects } = useQuery({ 
    queryKey: CACHE_KEYS.PROJECTS, 
    queryFn: projects_all 
  });
  const { data: invoices = [] } = useQuery({ 
    queryKey: CACHE_KEYS.INVOICES, 
    queryFn: invoices_all 
  });

  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [notes, setNotes] = useState("");
  const [gstEnabled, setGstEnabled] = useState(true);
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  });
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", title: "Website Development", qty: 1, rate: 25000, amount: 25000 }
  ]);

  const selectedClient = clients.find((c: any) => c.id === clientId);
  const filteredProjects = projects.filter((p: any) => p.client_id === clientId);

  const invoiceNumber = useMemo(() => {
    if (!settings) return "";
    const year = new Date().getFullYear();
    const prefix = `${settings.invoice_prefix}-${year}-`;
    const maxSeq = (invoices ?? [])
      .filter((inv:any) => inv.invoice_number?.startsWith(prefix))
      .map((inv:any) => { const m = inv.invoice_number?.match(/(\d{4})$/); return m ? parseInt(m[1]) : 0; })
      .reduce((max:number, n:number) => (n>max?n:max), 0);
    return `${prefix}${String(maxSeq + 1).padStart(4,'0')}`;
  }, [settings, invoices]);

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const gstAmount = gstEnabled && settings ? subtotal * (settings.default_gst_percent / 100) : 0;
  const totalAmount = subtotal + gstAmount;

  const upiVpa = selectedClient?.upi_vpa || settings?.upi_vpa || "";
  const upiLink = useMemo(() => {
    if (!totalAmount || !upiVpa || !settings) return "";
    return `upi://pay?pa=${upiVpa}&pn=${encodeURIComponent(settings.creator_display_name)}&am=${totalAmount.toFixed(0)}&tn=INV%20${invoiceNumber}`;
  }, [totalAmount, invoiceNumber, settings, upiVpa]);

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

  const handleClientSelect = (newClientId: string) => {
    setClientId(newClientId);
    setProjectId(""); // Reset project when client changes
  };

  const handleClientCreated = async (newClientId: string) => {
    // Set client immediately for UI responsiveness
    setClientId(newClientId);
    setProjectId(""); // Reset project when client changes
    
    // Trigger background refetch without awaiting
    refetchClients();
    
    // Invalidate related caches
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.CLIENTS }),
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PROJECTS }),
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DASHBOARD })
    ]);
    
    toast({ title: "Client created and selected" });
  };

  const handleProjectCreated = () => {
    refetchProjects();
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PROJECTS });
  };

  const saveDraft = async () => {
    // Check for demo mode or no session
    if (isDemoMode) {
      toast({ 
        title: "Demo mode: saving is disabled",
        variant: "destructive" 
      });
      return;
    }
    
    if (!session) {
      toast({ 
        title: "Sign in required", 
        description: "Please sign in to save invoices",
        variant: "destructive" 
      });
      return;
    }

    if (!clientId) {
      toast({ title: "Please select a client", variant: "destructive" });
      return;
    }
    
    if (!dueDate) {
      toast({ title: "Please set a due date", variant: "destructive" });
      return;
    }
    
    if (lineItems.length === 0 || lineItems.some(item => !item.title.trim())) {
      toast({ title: "Please add at least one line item with a title", variant: "destructive" });
      return;
    }
    
    try {
      // Collision-safe invoice creation with retry logic
      let invoice;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        try {
          const invoiceData = {
            invoice_number: invoiceNumber,
            client_id: clientId,
            project_id: projectId || null,
            issue_date: new Date().toISOString(),
            due_date: new Date(dueDate).toISOString(),
            subtotal,
            gst_amount: gstAmount,
            total_amount: totalAmount,
            status: "draft" as const
          };

          invoice = await create_invoice(invoiceData);
          break; // Success, exit retry loop
        } catch (error: any) {
          if (error?.code === '23505' && error?.message?.includes('invoice_number')) {
            // Unique violation on invoice number, retry with incremented number
            attempts++;
            if (attempts >= maxAttempts) {
              throw new Error("Unable to generate unique invoice number after multiple attempts");
            }
            continue;
          }
          throw error; // Re-throw other errors
        }
      }
      
      // Create line items
      for (const item of lineItems) {
        await create_item({
          invoice_id: invoice.id,
          title: item.title,
          qty: item.qty,
          rate: item.rate,
          amount: item.amount
        });
      }

      await create_message_log({
        related_type: "invoice",
        related_id: invoice.id,
        channel: "whatsapp",
        template_used: "invoice_draft",
        outcome: "saved"
      });

      await Promise.all([
        invalidateInvoiceCaches(queryClient),
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DASHBOARD }),
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.MESSAGES })
      ]);
      toast({ title: "Draft saved successfully" });
      navigate("/invoices");
    } catch (error: any) {
      console.error('Save draft error:', error);
      toast({ 
        title: "Error saving invoice", 
        description: error?.message ?? "Something went wrong", 
        variant: "destructive" 
      });
    }
  };

  const sendInvoice = async () => {
    // Check for demo mode or no session
    if (isDemoMode) {
      toast({ 
        title: "Demo mode: saving is disabled",
        variant: "destructive" 
      });
      return;
    }
    
    if (!session) {
      toast({ 
        title: "Sign in required", 
        description: "Please sign in to send invoices",
        variant: "destructive" 
      });
      return;
    }

    if (!clientId) {
      toast({ title: "Please select a client", variant: "destructive" });
      return;
    }
    
    if (!dueDate) {
      toast({ title: "Please set a due date", variant: "destructive" });
      return;
    }
    
    if (lineItems.length === 0 || lineItems.some(item => !item.title.trim())) {
      toast({ title: "Please add at least one line item with a title", variant: "destructive" });
      return;
    }
    
    try {
      // Collision-safe invoice creation with retry logic
      let invoice;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        try {
          const invoiceData = {
            invoice_number: invoiceNumber,
            client_id: clientId,
            project_id: projectId || null,
            issue_date: new Date().toISOString(),
            due_date: new Date(dueDate).toISOString(),
            subtotal,
            gst_amount: gstAmount,
            total_amount: totalAmount,
            status: "sent" as const
          };

          invoice = await create_invoice(invoiceData);
          break; // Success, exit retry loop
        } catch (error: any) {
          if (error?.code === '23505' && error?.message?.includes('invoice_number')) {
            // Unique violation on invoice number, retry with incremented number
            attempts++;
            if (attempts >= maxAttempts) {
              throw new Error("Unable to generate unique invoice number after multiple attempts");
            }
            continue;
          }
          throw error; // Re-throw other errors
        }
      }
      
      // Create line items
      for (const item of lineItems) {
        await create_item({
          invoice_id: invoice.id,
          title: item.title,
          qty: item.qty,
          rate: item.rate,
          amount: item.amount
        });
      }

      // Create reminders from issue date
      const issueDate = new Date();
      const reminder3Days = new Date(issueDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      const reminder7Days = new Date(issueDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const reminder14Days = new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000);

      await Promise.all([
        create_reminder({
          invoice_id: invoice.id,
          scheduled_at: reminder3Days.toISOString(),
          channel: "whatsapp",
          status: "pending"
        }),
        create_reminder({
          invoice_id: invoice.id,
          scheduled_at: reminder7Days.toISOString(),
          channel: "whatsapp", 
          status: "pending"
        }),
        create_reminder({
          invoice_id: invoice.id,
          scheduled_at: reminder14Days.toISOString(),
          channel: "whatsapp",
          status: "pending"
        })
      ]);

      await create_message_log({
        related_type: "invoice",
        related_id: invoice.id,
        channel: "whatsapp",
        template_used: "invoice_sent",
        outcome: "queued"
      });

      await Promise.all([
        invalidateInvoiceCaches(queryClient),
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.REMINDERS }),
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.MESSAGES }),
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DASHBOARD })
      ]);
      toast({ title: "Invoice sent successfully" });
      celebrate('invoice_sent');
      navigate("/invoices");
    } catch (error: any) {
      console.error('Send invoice error:', error);
      toast({ 
        title: "Error saving invoice", 
        description: error?.message ?? "Something went wrong", 
        variant: "destructive" 
      });
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading invoice settings...</p>
        </div>
      </div>
    );
  }

  if (settingsError || !settings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Create Invoice</h1>
          <Button variant="outline" onClick={() => navigate("/invoices")}>Cancel</Button>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load invoice settings. Please ensure demo data is populated first by visiting the{" "}
            <Button variant="link" className="h-auto p-0" onClick={() => navigate("/qa")}>
              QA page
            </Button>{" "}
            and clicking "Populate Demo Data".
          </AlertDescription>
        </Alert>
        
        {clients.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No clients found. Demo data needs to be populated to create invoices.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SEO title="HustleHub — Create Invoice" description="Create a new invoice with live preview and UPI payment link." />
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create Invoice</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/invoices")}>Cancel</Button>
          <Button 
            variant="outline" 
            onClick={saveDraft}
            disabled={isDemoMode || !session}
            title={isDemoMode ? "Demo mode: saving is disabled" : !session ? "Sign in to save invoices" : ""}
          >
            <FileText className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button 
            onClick={sendInvoice} 
            variant="gradient"
            disabled={isDemoMode || !session}
            title={isDemoMode ? "Demo mode: saving is disabled" : !session ? "Sign in to send invoices" : ""}
          >
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
                <div className="flex gap-2">
                  <Select value={clientId} onValueChange={handleClientSelect}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => setShowClientModal(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {clientId && (
                <div className="space-y-2">
                  <Label htmlFor="project">Project (Optional)</Label>
                  <div className="flex gap-2">
                    <Select value={projectId} onValueChange={setProjectId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProjects.map((project: any) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => setShowProjectModal(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
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
                <Label>Include GST ({settings.default_gst_percent}%)</Label>
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
                    <p className="text-sm text-muted-foreground">{settings.creator_display_name}</p>
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
                    <span>GST ({settings.default_gst_percent}%):</span>
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
          {totalAmount > 0 && upiVpa && (
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
                    <span className="font-medium">{settings.creator_display_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>UPI ID:</span>
                    <span className="font-medium">{upiVpa}</span>
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

      <AddClientModal 
        isOpen={showClientModal} 
        onClose={() => setShowClientModal(false)} 
        onSuccess={handleClientCreated} 
      />

      {clientId && (
        <AddProjectModal 
          isOpen={showProjectModal} 
          onClose={() => setShowProjectModal(false)} 
          clientId={clientId}
          onSuccess={handleProjectCreated} 
        />
      )}
    </div>
  );
}