import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { clients_all, create_client, delete_client } from "@/data/collections";
import { useToast } from "@/hooks/use-toast";
import ClientEditModal from "@/components/ClientEditModal";
import { validateIndianMobile } from "@/services/payments";
import { friendlyDeleteError } from "@/lib/supabaseErrors";

export default function Clients() {
  const { data: clients = [], refetch } = useQuery({ queryKey: ["clients_all"], queryFn: clients_all });
  const [isOpen, setIsOpen] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteClient, setDeleteClient] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    email: "",
    gstin: "",
    upi_vpa: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phoneError, setPhoneError] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();

  // Auto-open modal if navigated from Quick Actions
  useEffect(() => {
    if (location.state?.openModal) {
      setIsOpen(true);
    }
  }, [location.state]);

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Enter a valid email';
        } else {
          delete newErrors.email;
        }
        break;
      case 'whatsapp':
        if (value) {
          const phoneValidation = validateIndianMobile(value);
          if (!phoneValidation.valid) {
            newErrors.whatsapp = 'Enter a valid phone number';
          } else {
            delete newErrors.whatsapp;
          }
        } else {
          delete newErrors.whatsapp;
        }
        break;
      case 'upi_vpa':
        if (value && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(value)) {
          newErrors.upi_vpa = 'Enter a valid UPI ID (e.g., name@bank)';
        } else {
          delete newErrors.upi_vpa;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before submission
    Object.entries(formData).forEach(([name, value]) => {
      validateField(name, value);
    });

    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      toast({ 
        title: "Please fix validation errors", 
        variant: "destructive" 
      });
      return;
    }
    
    // Also check phone validation separately (legacy)
    const phoneValidation = validateIndianMobile(formData.whatsapp);
    if (formData.whatsapp && !phoneValidation.valid) {
      setPhoneError(phoneValidation.error || "Invalid phone number");
      return;
    }
    
    try {
      await create_client(formData);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["clients_all"] });
      setIsOpen(false);
      setFormData({ name: "", whatsapp: "", email: "", gstin: "", upi_vpa: "" });
      setErrors({});
      setPhoneError("");
      toast({ title: "Client created successfully" });
    } catch (error: any) {
      toast({
        title: "Error creating client",
        description: error?.message ?? "Something went wrong",
        variant: "destructive"
      });
    }
  };

  const handleWhatsAppChange = (value: string) => {
    handleInputChange('whatsapp', value);
    if (phoneError) {
      // Clear legacy error when user starts typing
      const validation = validateIndianMobile(value);
      if (validation.valid) {
        setPhoneError("");
      }
    }
  };

  const handleEditClient = (client: any) => {
    setEditClient(client);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async () => {
    await refetch();
    queryClient.invalidateQueries({ queryKey: ["clients_all"] });
    setIsEditModalOpen(false);
    setEditClient(null);
  };

  const handleDelete = async (client: any) => {
    try {
      await delete_client(client.id);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["clients_all"] });
      toast({ title: "Client deleted successfully" });
      setDeleteClient(null);
    } catch (error: any) {
      const friendlyError = friendlyDeleteError(error, 'client');
      toast({
        title: "Error deleting client",
        description: friendlyError || (error?.message ?? "Something went wrong"),
        variant: "destructive"
      });
    }
  };

  const isFormValid = Object.keys(errors).length === 0 && formData.name.trim();

  return (
    <div className="space-y-6">
      <SEO title="HustleHub — Clients" description="Client directory for the demo." />
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button data-testid="btn-add-client">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  data-testid="client-form-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => handleWhatsAppChange(e.target.value)}
                  placeholder="e.g., 9876543210 or +91 98765 43210"
                />
                {(phoneError || errors.whatsapp) && (
                  <p className="text-sm text-destructive mt-1">{phoneError || errors.whatsapp}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Enter 10-digit Indian mobile number starting with 6-9
                </p>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  data-testid="client-form-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  value={formData.gstin}
                  onChange={(e) => handleInputChange('gstin', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="upi_vpa">UPI VPA</Label>
                <Input
                  id="upi_vpa"
                  value={formData.upi_vpa}
                  onChange={(e) => handleInputChange('upi_vpa', e.target.value)}
                  placeholder="e.g., name@bank"
                />
                {errors.upi_vpa && (
                  <p className="text-sm text-destructive mt-1">{errors.upi_vpa}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="btn-client-add-submit" disabled={!isFormValid}>Create Client</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Clients</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead>UPI VPA</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id} data-testid="client-row">
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.whatsapp || "—"}</TableCell>
                  <TableCell>{c.email || "—"}</TableCell>
                  <TableCell>{c.gstin || "—"}</TableCell>
                  <TableCell>{c.upi_vpa || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClient(c)}
                        data-testid="btn-client-edit"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteClient(c)}
                        data-testid="btn-client-delete"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ClientEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        client={editClient}
        onSave={handleEditSave}
      />

      <AlertDialog open={!!deleteClient} onOpenChange={() => setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteClient?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteClient)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
