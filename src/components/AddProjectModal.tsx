import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { create_project } from "@/data/collections";
import { useToast } from "@/hooks/use-toast";

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess: (projectId: string) => void;
}

export default function AddProjectModal({ isOpen, onClose, clientId, onSuccess }: AddProjectModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    is_billable: true
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const project = await create_project({
        client_id: clientId,
        name: formData.name,
        is_billable: formData.is_billable
      });
      onSuccess(project.id);
      setFormData({ name: "", is_billable: true });
      onClose();
      toast({ title: "Project created successfully" });
    } catch (error) {
      toast({ title: "Error creating project", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_billable"
              checked={formData.is_billable}
              onCheckedChange={(checked) => setFormData({ ...formData, is_billable: checked })}
            />
            <Label htmlFor="is_billable">Billable</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}