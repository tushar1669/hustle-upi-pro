import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { create_savings_goal, update_savings_goal } from "@/data/collections";
import { useToast } from "@/hooks/use-toast";

interface AddSavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  goal?: {
    id: string;
    title: string;
    target_amount: number;
    saved_amount: number;
    target_date?: string;
    type?: string;
  };
}

const goalTypes = [
  { value: "Emergency", label: "Emergency Fund" },
  { value: "Tax", label: "Tax Savings" },
  { value: "General", label: "General Savings" },
  { value: "Other", label: "Other" },
];

export function AddSavingsGoalModal({ isOpen, onClose, onSave, goal }: AddSavingsGoalModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: goal?.title || "",
    target_amount: goal?.target_amount || "",
    saved_amount: goal?.saved_amount || 0,
    target_date: goal?.target_date ? new Date(goal.target_date) : undefined as Date | undefined,
    type: goal?.type || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!formData.title || !formData.target_amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        target_amount: Number(formData.target_amount),
        saved_amount: Number(formData.saved_amount),
        target_date: formData.target_date ? format(formData.target_date, "yyyy-MM-dd") : undefined,
        type: formData.type || "General",
      };

      if (goal) {
        await update_savings_goal(goal.id, payload);
        toast({ title: "Goal updated successfully" });
      } else {
        await create_savings_goal(payload);
        toast({ title: "Goal created successfully" });
      }

      onSave();
      onClose();
      setFormData({
        title: "",
        target_amount: "",
        saved_amount: 0,
        target_date: undefined,
        type: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save goal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit Goal" : "Add New Goal"}</DialogTitle>
          <DialogDescription>
            {goal ? "Update your savings goal details." : "Create a new savings goal to track your progress."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Emergency Fund"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_amount">Target Amount (₹) *</Label>
            <Input
              id="target_amount"
              type="number"
              value={formData.target_amount}
              onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
              placeholder="100000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="saved_amount">Current Saved Amount (₹)</Label>
            <Input
              id="saved_amount"
              type="number"
              value={formData.saved_amount}
              onChange={(e) => setFormData({ ...formData, saved_amount: Number(e.target.value) })}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Target Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.target_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.target_date ? format(formData.target_date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.target_date}
                  onSelect={(date) => setFormData({ ...formData, target_date: date })}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Goal Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select goal type" />
              </SelectTrigger>
              <SelectContent>
                {goalTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading}
            data-testid={goal ? "goal-edit-save" : "goal-add-save"}
          >
            {loading ? "Saving..." : goal ? "Update Goal" : "Create Goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}