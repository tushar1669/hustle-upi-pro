import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import SEO from "@/components/SEO";
import { Target, Plus, TrendingUp, PiggyBank } from "lucide-react";

const SavingsGoals = () => {
  // Mock data for demonstration
  const goals = [
    {
      id: 1,
      title: "Emergency Fund",
      target: 100000,
      current: 45000,
      deadline: "Dec 2024",
      category: "Safety",
    },
    {
      id: 2,
      title: "New Equipment",
      target: 50000,
      current: 32000,
      deadline: "Mar 2025",
      category: "Business",
    },
  ];

  const getProgress = (current: number, target: number) => (current / target) * 100;

  return (
    <div className="space-y-6">
      <SEO title="Savings Goals — HustleHub" description="Track your financial goals and savings progress" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Savings Goals</h1>
          <p className="text-muted-foreground">Set and track your financial milestones</p>
        </div>
        <Button className="flex items-center gap-2">
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
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">2</div>
            <p className="text-xs text-muted-foreground">in progress</p>
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
            <div className="text-2xl font-bold text-success">₹77,000</div>
            <p className="text-xs text-muted-foreground">across all goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-accent" />
              Monthly Avg
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">₹12,500</div>
            <p className="text-xs text-muted-foreground">savings rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal) => (
          <Card key={goal.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    {goal.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Target by {goal.deadline}</p>
                </div>
                <Badge variant="outline">{goal.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>₹{goal.current.toLocaleString()} of ₹{goal.target.toLocaleString()}</span>
              </div>
              <Progress value={getProgress(goal.current, goal.target)} className="h-3" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {Math.round(getProgress(goal.current, goal.target))}% complete
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Update</Button>
                  <Button size="sm">Add Funds</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {goals.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Start Your First Savings Goal</h3>
          <p className="text-muted-foreground mb-4">
            Set financial targets and track your progress towards achieving them.
          </p>
          <Button>
            Create Your First Goal
          </Button>
        </div>
      )}
    </div>
  );
};

export default SavingsGoals;