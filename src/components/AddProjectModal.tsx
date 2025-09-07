import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { create_project, update_project, clients_all } from "@/data/collections";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { CACHE_KEYS } from "@/hooks/useCache";

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  onSuccess: () => void;
  editProject?: { id: string; name: string; client_id: string | null; is_billable: boolean } | null;
}

export default function AddProjectModal({ isOpen, onClose, clientId, onSuccess, editProject }: AddProjectModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    client_id: clientId || "",
    is_billable: true
  });
  const { toast } = useToast();
  const { data: clients = [] } = useQuery({ queryKey: CACHE_KEYS.CLIENTS, queryFn: clients_all });

  useEffect(() => {
    if (editProject) {
      setFormData({
        name: editProject.name,
        client_id: editProject.client_id || "",
        is_billable: editProject.is_billable
      });
    } else {
      setFormData({
        name: "",
        client_id: clientId || "",
        is_billable: true
      });
    }
  }, [editProject, clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editProject) {
        await update_project(editProject.id, {
          name: formData.name,
          client_id: formData.client_id || null,
          is_billable: formData.is_billable
        });
        toast({ title: "Project updated successfully" });
      } else {
        await create_project({
          client_id: formData.client_id || null,
          name: formData.name,
          is_billable: formData.is_billable
        });
        toast({ title: "Project created successfully" });
      }
      onSuccess();
      setFormData({ name: "", client_id: "", is_billable: true });
      onClose();
    } catch (error) {
      toast({ title: `Error ${editProject ? 'updating' : 'creating'} project`, variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
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
          <div>
            <Label htmlFor="client">Client</Label>
            <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No client</SelectItem>
                {clients.map((client: any) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button type="submit">{editProject ? 'Update Project' : 'Create Project'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}