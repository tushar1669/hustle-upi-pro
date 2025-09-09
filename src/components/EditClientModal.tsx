import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: any;
  onSave: (clientData: any) => Promise<void>;
}

export default function EditClientModal({ isOpen, onClose, client, onSave }: EditClientModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    email: "",
    gstin: "",
    upi_vpa: "",
    address: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        whatsapp: client.whatsapp || "",
        email: client.email || "",
        gstin: client.gstin || "",
        upi_vpa: client.upi_vpa || "",
        address: client.address || ""
      });
    }
  }, [client]);

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
        if (value && !/^(\+91|0)?[6-9]\d{9}$/.test(value.replace(/\s/g, ''))) {
          newErrors.whatsapp = 'Enter a valid phone number';
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

    // Validate all fields
    Object.entries(formData).forEach(([name, value]) => {
      validateField(name, value);
    });

    // Check if there are any errors
    if (Object.keys(errors).length > 0) {
      toast({ title: "Please fix validation errors", variant: "destructive" });
      return;
    }

    try {
      await onSave(formData);
      onClose();
      toast({ title: "Client updated successfully" });
    } catch (error: any) {
      toast({
        title: "Error updating client",
        description: error?.message ?? "Something went wrong",
        variant: "destructive"
      });
    }
  };

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
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
              onChange={(e) => handleInputChange('whatsapp', e.target.value)}
              placeholder="+91 9876543210"
            />
            {errors.whatsapp && (
              <p className="text-sm text-destructive mt-1">{errors.whatsapp}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="client@example.com"
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
              placeholder="22AAAAA0000A1Z5"
            />
          </div>
          
          <div>
            <Label htmlFor="upi_vpa">UPI VPA</Label>
            <Input
              id="upi_vpa"
              value={formData.upi_vpa}
              onChange={(e) => handleInputChange('upi_vpa', e.target.value)}
              placeholder="client@upi"
            />
            {errors.upi_vpa && (
              <p className="text-sm text-destructive mt-1">{errors.upi_vpa}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Client address"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={Object.keys(errors).length > 0}>
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}