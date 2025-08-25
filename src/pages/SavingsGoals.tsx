import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import SEO from "@/components/SEO";
import { AddSavingsGoalModal } from "@/components/AddSavingsGoalModal";
import { Target, Plus, TrendingUp, PiggyBank, Edit, Trash2 } from "lucide-react";
import { savings_goals_all, delete_savings_goal } from "@/data/collections";
import { CACHE_KEYS } from "@/hooks/useCache";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SavingsGoal {
  id: string;
  title: string;
  target_amount: number;
  saved_amount: number;
  target_date?: string;
  type?: string;
  created_at?: string;
}

const SavingsGoals = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: CACHE_KEYS.SAVINGS_GOALS,
    queryFn: async () => {
      const data = await savings_goals_all();
      return data as SavingsGoal[];
    },
  });

  const getProgress = (current: number, target: number) => (target > 0 ? (current / target) * 100 : 0);

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setModalOpen(true);
  };

  const handleDelete = async (goalId: string) => {
    try {
      await delete_savings_goal(goalId);
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.SAVINGS_GOALS });
      toast({ title: "Goal deleted successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete goal",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setGoalToDelete(null);
    }
  };

  const handleModalSave = () => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.SAVINGS_GOALS });
    setEditingGoal(null);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingGoal(null);
  };

  // Calculate summary stats
  const totalGoals = goals.length;
  const totalSaved = goals.reduce((sum, goal) => sum + (goal.saved_amount || 0), 0);
  const averageProgress = totalGoals > 0
    ? goals.reduce((sum, goal) => sum + getProgress(goal.saved_amount || 0, goal.target_amount || 0), 0) / totalGoals
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SEO title="Savings Goals — HustleHub" description="Track your financial goals and savings progress" />
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading goals...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SEO title="Savings Goals — HustleHub" description="Track your financial goals and savings progress" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Savings Goals</h1>
          <p className="text-muted-foreground">Set and track your financial milestones</p>
        </div>
        <Button 
          className="flex items-center gap-2" 
          onClick={() => setModalOpen(true)}
          data-testid="btn-add-goal"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-primary" />
              Total Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalGoals}</div>
            <p className="text-xs text-muted-foreground">goals created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <PiggyBank className="w-4 h-4 text-success" />
              Total Saved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">₹{totalSaved.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground">across all goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-accent" />
              Average Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{averageProgress.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const progress = getProgress(goal.saved_amount || 0, goal.target_amount || 0);
          const isHighProgress = progress > 80;
          
          return (
            <Card key={goal.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="w-5 h-5 text-primary" />
                      {goal.title}
                    </CardTitle>
                    {goal.target_date && (
                      <p className="text-sm text-muted-foreground">
                        Target: {format(new Date(goal.target_date), "MMM dd, yyyy")}
                      </p>
                    )}
                  </div>
                  {goal.type && (
                    <Badge variant="outline">{goal.type}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>₹{(goal.saved_amount || 0).toLocaleString("en-IN")} of ₹{(goal.target_amount || 0).toLocaleString("en-IN")}</span>
                </div>
                <Progress 
                  value={progress} 
                  className={cn("h-3", isHighProgress && "progress-high")}
                  data-testid={`progress-bar-goal-${goal.id}`}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {Math.round(progress)}% complete
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(goal)}
                      data-testid="btn-edit-goal"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setGoalToDelete(goal.id);
                        setDeleteDialogOpen(true);
                      }}
                      data-testid="btn-delete-goal"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {goals.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Start Your First Savings Goal</h3>
          <p className="text-muted-foreground mb-4">
            Set financial targets and track your progress towards achieving them.
          </p>
          <Button onClick={() => setModalOpen(true)} data-testid="btn-add-goal">
            Create Your First Goal
          </Button>
        </div>
      )}

      {/* Add/Edit Goal Modal */}
      <AddSavingsGoalModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        goal={editingGoal}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this savings goal? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => goalToDelete && handleDelete(goalToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SavingsGoals;