import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { create_task, create_message_log, projects_all } from "@/data/collections";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTaskModal({ isOpen, onClose, onSuccess }: AddTaskModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    project_id: "",
    due_date: "",
    is_billable: false,
    notes: ""
  });
  const { toast } = useToast();
  const { data: projects = [] } = useQuery({ queryKey: ["projects_all"], queryFn: projects_all });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Creating task..." });
    
    try {
      const task = await create_task({
        title: formData.title,
        project_id: formData.project_id || null,
        due_date: formData.due_date || null,
        is_billable: formData.is_billable,
        status: "open",
        notes: formData.notes || null
      });
      
      // Log task creation
      await create_message_log({
        related_type: "task",
        related_id: task.id,
        channel: "whatsapp",
        template_used: "task_created",
        outcome: "ok"
      });

      // Success actions
      onSuccess();
      setFormData({ title: "", project_id: "", due_date: "", is_billable: false, notes: "" });
      onClose();
      toast({ title: "✅ Task created successfully" });
    } catch (error: any) {
      console.error('Task creation error:', error);
      toast({ title: "❌ Error creating task", description: error.message || "Unknown error", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="project">Project</Label>
            <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select project (optional)" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
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
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}