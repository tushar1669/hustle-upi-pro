import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { create_client } from "@/data/collections";
import { useToast } from "@/hooks/use-toast";
import { validateIndianMobile } from "@/services/payments";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (clientId: string) => void;
}

export default function AddClientModal({ isOpen, onClose, onSuccess }: AddClientModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    email: "",
    gstin: "",
    upi_vpa: ""
  });
  const [phoneError, setPhoneError] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name.trim()) {
        toast({ title: "Client name is required", variant: "destructive" });
        return;
      }

      // Validate phone number
      const phoneValidation = validateIndianMobile(formData.whatsapp);
      if (!phoneValidation.valid) {
        setPhoneError(phoneValidation.error || "Invalid phone number");
        return;
      }
      
      const client = await create_client(formData);
      onSuccess(client.id);
      setFormData({ name: "", whatsapp: "", email: "", gstin: "", upi_vpa: "" });
      setPhoneError("");
      onClose();
      toast({ title: "Client created successfully" });
    } catch (error) {
      console.error('Client creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('name')) {
        toast({ title: "Error: Client name is invalid", variant: "destructive" });
      } else if (errorMessage.includes('email')) {
        toast({ title: "Error: Invalid email format", variant: "destructive" });
      } else {
        toast({ title: `Error creating client: ${errorMessage}`, variant: "destructive" });
      }
    }
  };

  const handleWhatsAppChange = (value: string) => {
    setFormData({ ...formData, whatsapp: value });
    if (phoneError) {
      // Clear error when user starts typing
      const validation = validateIndianMobile(value);
      if (validation.valid) {
        setPhoneError("");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            {phoneError && (
              <p className="text-sm text-destructive mt-1">{phoneError}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Enter 10-digit Indian mobile number starting with 6-9
            </p>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="gstin">GSTIN</Label>
            <Input
              id="gstin"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="upi_vpa">UPI VPA</Label>
            <Input
              id="upi_vpa"
              value={formData.upi_vpa}
              onChange={(e) => setFormData({ ...formData, upi_vpa: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" data-testid="btn-client-add-submit">Create Client</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}