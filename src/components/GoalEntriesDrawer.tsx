import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, X, ClipboardList } from "lucide-react";
import { entries_by_goal, delete_entry } from "@/data/collections";
import { invalidateSavingsGoalsCaches } from "@/hooks/useCache";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface GoalEntriesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: string;
  goalTitle: string;
}

interface SavingsEntry {
  id: string;
  goal_id: string;
  amount: number;
  note?: string;
  created_at: string;
}

export default function GoalEntriesDrawer({ isOpen, onClose, goalId, goalTitle }: GoalEntriesDrawerProps) {
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch entries for this goal
  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ['savings_entries', goalId],
    queryFn: () => entries_by_goal(goalId),
    enabled: !!goalId && isOpen,
  });

  // Sort entries newest first
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Handle deleting an entry
  const handleDeleteEntry = async (entryId: string) => {
    try {
      await delete_entry(entryId);
      queryClient.invalidateQueries({ queryKey: ['savings_entries', goalId] });
      await invalidateSavingsGoalsCaches(queryClient);
      toast({ title: 'Entry deleted' });
    } catch (error) {
      toast({
        title: "Error deleting entry",
        variant: "destructive",
      });
    }
    setDeleteEntryId(null);
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader className="flex flex-row items-center justify-between">
            <DrawerTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Entries for "{goalTitle}"
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" title="Close">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          
          <div className="px-6 pb-6">
            {isLoading ? (
              <div className="text-center py-8">Loading entries...</div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                Error loading entries
              </div>
            ) : sortedEntries.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No entries yet for this goal</h3>
                <p className="text-muted-foreground">
                  Add entries from the goals page to track your progress
                </p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedEntries.map((entry: SavingsEntry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          ₹{entry.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {entry.note || <span className="text-muted-foreground">No note</span>}
                        </TableCell>
                        <TableCell>
                          {new Date(entry.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteEntryId(entry.id)}
                            title="Delete entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteEntryId} onOpenChange={() => setDeleteEntryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteEntryId && handleDeleteEntry(deleteEntryId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}