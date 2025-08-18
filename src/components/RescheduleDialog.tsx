import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface RescheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newDateTime: string) => void;
  currentDateTime: string;
  reminder?: any;
  bulkMode?: boolean;
  selectedCount?: number;
}

export function RescheduleDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  currentDateTime,
  reminder,
  bulkMode,
  selectedCount 
}: RescheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(currentDateTime));
  const [selectedTime, setSelectedTime] = useState(
    new Date(currentDateTime).toTimeString().slice(0, 5)
  );

  const handleConfirm = () => {
    const [hours, minutes] = selectedTime.split(':');
    const newDateTime = new Date(selectedDate);
    newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Ensure it's in the future
    if (newDateTime <= new Date()) {
      return;
    }
    
    onConfirm(newDateTime.toISOString());
    onClose();
  };

  const isValidDateTime = () => {
    if (!selectedDate || !selectedTime) return false;
    
    const [hours, minutes] = selectedTime.split(':');
    const newDateTime = new Date(selectedDate);
    newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return newDateTime > new Date();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reschedule Reminder</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {reminder && (
            <div className="text-sm text-muted-foreground">
              Rescheduling reminder for <span className="font-medium">{reminder.channel}</span> channel
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full"
            />
          </div>
          
          {!isValidDateTime() && (
            <div className="text-sm text-destructive">
              Please select a future date and time
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValidDateTime()}>
            Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}