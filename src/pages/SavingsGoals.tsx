import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trash2, Edit, Plus, Target, TrendingUp, Percent, PlusCircle, ClipboardList } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { savings_goals_all, delete_savings_goal, entries_by_goal } from "@/data/collections";
import { useToast } from "@/hooks/use-toast";
import GoalModal from "@/components/GoalModal";
import AddEntryModal from "@/components/AddEntryModal";
import GoalEntriesDrawer from "@/components/GoalEntriesDrawer";
import { invalidateSavingsGoalsCaches } from "@/hooks/useCache";

interface SavingsGoal {
  id: string;
  title: string;
  target_amount: number;
  saved_amount: number;
  target_date?: string;
  type?: string;
  created_at?: string;
}

interface SavingsEntry {
  id: string;
  goal_id: string;
  amount: number;
  note?: string;
  created_at: string;
}

export default function SavingsGoals() {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [entriesFor, setEntriesFor] = useState<{id: string, title: string} | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all savings goals
  const { data: goals = [], isLoading, error } = useQuery({
    queryKey: ["savings_goals_all"],
    queryFn: savings_goals_all,
  });

  // Fetch entries for all goals to calculate actual progress
  const { data: allEntries = [] } = useQuery({
    queryKey: ["savings_entries"],
    queryFn: async () => {
      const entriesPromises = goals.map((goal: SavingsGoal) => 
        entries_by_goal(goal.id).then(entries => ({ goalId: goal.id, entries }))
      );
      const results = await Promise.all(entriesPromises);
      return results.reduce((acc, { goalId, entries }) => {
        acc[goalId] = entries;
        return acc;
      }, {} as Record<string, SavingsEntry[]>);
    },
    enabled: goals.length > 0,
  });

  // Calculate actual saved amount from entries
  const getActualSaved = (goalId: string) => {
    const entries = allEntries[goalId] || [];
    return entries.reduce((sum, entry) => sum + entry.amount, 0);
  };

  // Helper function to calculate progress percentage
  const getProgress = (saved: number, target: number) => {
    return Math.min((saved / target) * 100, 100);
  };

  // Handle editing a goal
  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setIsGoalModalOpen(true);
  };

  // Handle adding entry to goal
  const handleAddEntry = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setIsEntryModalOpen(true);
  };

  // Handle deleting a goal
  const handleDelete = async (goalId: string) => {
    try {
      await delete_savings_goal(goalId);
      invalidateSavingsGoalsCaches(queryClient);
      toast({ title: "Goal deleted successfully" });
    } catch (error) {
      toast({
        title: "Error deleting goal",
        variant: "destructive",
      });
    }
    setDeleteGoalId(null);
  };

  // Handle modal success
  const handleModalSuccess = () => {
    invalidateSavingsGoalsCaches(queryClient);
  };

  // Handle goal modal close
  const handleGoalModalClose = () => {
    setIsGoalModalOpen(false);
    setEditingGoal(null);
  };

  // Handle entry modal close
  const handleEntryModalClose = () => {
    setIsEntryModalOpen(false);
    setSelectedGoal(null);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading savings goals</div>;

  // Calculate summary statistics using actual entries
  const totalGoals = goals.length;
  const totalSaved = goals.reduce((sum: number, goal: SavingsGoal) => {
    return sum + getActualSaved(goal.id);
  }, 0);
  const averageProgress = totalGoals > 0 
    ? goals.reduce((sum: number, goal: SavingsGoal) => {
        const saved = getActualSaved(goal.id);
        return sum + getProgress(saved, goal.target_amount);
      }, 0) / totalGoals 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
          <p className="text-muted-foreground">Track your financial progress</p>
        </div>
        <Button onClick={() => setIsGoalModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Goal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSaved.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageProgress.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Start your savings journey by creating your first goal
            </p>
            <Button onClick={() => setIsGoalModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal: SavingsGoal) => {
            const actualSaved = getActualSaved(goal.id);
            const progress = getProgress(actualSaved, goal.target_amount);
            
            return (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      {goal.target_date && (
                        <p className="text-sm text-muted-foreground">
                          Target: {new Date(goal.target_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEntriesFor({ id: goal.id, title: goal.title })}
                        title="View entries"
                      >
                        <ClipboardList className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddEntry(goal)}
                        title="Add Entry"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(goal)}
                        title="Edit Goal"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteGoalId(goal.id)}
                        title="Delete Goal"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>₹{actualSaved.toLocaleString()}</span>
                      <span>₹{goal.target_amount.toLocaleString()}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="text-sm text-muted-foreground text-center">
                      {progress.toFixed(1)}% complete
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Goal Modal */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={handleGoalModalClose}
        onSuccess={handleModalSuccess}
        goal={editingGoal}
      />

      {/* Add Entry Modal */}
      {selectedGoal && (
        <AddEntryModal
          isOpen={isEntryModalOpen}
          onClose={handleEntryModalClose}
          onSuccess={handleModalSuccess}
          goalId={selectedGoal.id}
          goalTitle={selectedGoal.title}
        />
      )}

      {/* Entries Drawer */}
      {entriesFor && (
        <GoalEntriesDrawer
          isOpen={!!entriesFor}
          onClose={() => setEntriesFor(null)}
          goalId={entriesFor.id}
          goalTitle={entriesFor.title}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteGoalId} onOpenChange={() => setDeleteGoalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your savings goal and all associated entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteGoalId && handleDelete(deleteGoalId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}