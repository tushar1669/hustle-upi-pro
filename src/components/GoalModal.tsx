import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { create_savings_goal, update_savings_goal } from "@/data/collections";
import { useToast } from "@/hooks/use-toast";

interface SavingsGoal {
  id: string;
  title: string;
  target_amount: number;
  target_date?: string;
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal?: SavingsGoal;
}

export default function GoalModal({ isOpen, onClose, onSuccess, goal }: GoalModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    target_amount: "",
    target_date: null as Date | null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        target_amount: goal.target_amount.toString(),
        target_date: goal.target_date ? new Date(goal.target_date) : null,
      });
    } else {
      setFormData({
        title: "",
        target_amount: "",
        target_date: null,
      });
    }
  }, [goal, isOpen]);

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.target_amount.trim()) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const targetAmount = parseFloat(formData.target_amount);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      toast({
        title: "Please enter a valid target amount",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        target_amount: targetAmount,
        target_date: formData.target_date ? formData.target_date.toISOString().split('T')[0] : undefined,
      };

      if (goal) {
        await update_savings_goal(goal.id, payload);
        toast({ title: "Goal updated successfully" });
      } else {
        await create_savings_goal(payload);
        toast({ title: "Goal created successfully" });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: `Error ${goal ? 'updating' : 'creating'} goal`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit Goal" : "New Savings Goal"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Goal Name *</Label>
            <Input
              id="title"
              placeholder="e.g., Emergency Fund"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="target_amount">Target Amount *</Label>
            <Input
              id="target_amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.target_amount}
              onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
            />
          </div>

          <div>
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
                  selected={formData.target_date || undefined}
                  onSelect={(date) => setFormData({ ...formData, target_date: date || null })}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="flex-1">
            {isLoading ? "Saving..." : goal ? "Update Goal" : "Create Goal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}