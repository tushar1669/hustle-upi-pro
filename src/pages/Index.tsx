import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import QuickActionsWidget from "@/components/QuickActionsWidget";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { message_log_recent, tasks_all, update_task, v_dashboard_metrics } from "@/data/collections";
import { useState, useEffect } from "react";
import { useCelebrationContext } from "@/components/CelebrationProvider";
import { TrendingUp, Target, Users, FileText, Plus, CheckCircle2, Clock, Send } from "lucide-react";
import QuickFollowupModal from "@/components/followups/QuickFollowupModal";

const currency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const Index = () => {
  const navigate = useNavigate();
  const { celebrate } = useCelebrationContext();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [quickFollowupModal, setQuickFollowupModal] = useState(false);

  // Check if user needs onboarding (could be based on settings or localStorage)
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem("hustlehub_onboarding_completed");
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const { data: metrics } = useQuery({ queryKey: ["v_dashboard_metrics"], queryFn: v_dashboard_metrics });
  const { data: tasks = [], refetch: refetchTasks } = useQuery({ queryKey: ["tasks_all"], queryFn: tasks_all });
  const { data: messageLog = [] } = useQuery({ queryKey: ["message_log_recent"], queryFn: message_log_recent });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices_all"], queryFn: async () => (await import("@/data/collections")).invoices_all() });

  const thisMonthPaid = metrics?.this_month_paid ?? 0;
  const overdueAmount = metrics?.overdue_amount ?? 0;
  const tasksDue7 = metrics?.tasks_due_7d ?? 0;

  const dueToday = tasks.filter(t => t.status === "open" && t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString());
  const overdueTasks = tasks.filter(t => t.status === "open" && t.due_date && new Date(t.due_date) < new Date());
  const overdueCount = invoices.filter((i: any) => i.status === "overdue").length;

  const handleMarkDone = async (taskId: string) => {
    await update_task(taskId, { status: "done" });
    await Promise.all([refetchTasks()]);
    await (await import("@/data/collections")).create_message_log({
      related_type: "task",
      related_id: taskId,
      channel: "whatsapp",
      template_used: "task_completed",
      outcome: "completed"
    });
    celebrate("task_done");
  };

  const handleOnboardingComplete = (data: any) => {
    localStorage.setItem("hustlehub_onboarding_completed", "true");
    setShowOnboarding(false);
    // TODO: Save onboarding data to settings
    console.log("Onboarding data:", data);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  return (
    <>
      <OnboardingWizard 
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
      
      <div className="space-y-6">
        <SEO title="HustleHub — Dashboard" description="Overview of invoices, tasks and follow-ups." />
        
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Good morning! 👋</h1>
            <p className="text-muted-foreground">Here's what's happening with your business today</p>
          </div>
          <Button onClick={() => setShowOnboarding(true)} variant="outline" size="sm">
            Setup Guide
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card 
            className="border-primary/20 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => navigate("/invoices")}
          >
            <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold text-primary">{currency(thisMonthPaid)}</div>
                <Badge variant="success" className="text-xs">+12%</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs last month</p>
            </CardContent>
          </Card>

          <Card 
            className="border-danger/20 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => navigate("/invoices")}
          >
            <CardHeader className="bg-gradient-to-r from-danger to-danger/80 text-danger-foreground pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold text-danger">{currency(overdueAmount)}</div>
                <Badge variant="danger" className="text-xs">{overdueCount} invoices</Badge>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">needs attention</p>
                {overdueCount > 0 && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setQuickFollowupModal(true)}
                    className="h-6 px-2 text-xs"
                    data-testid="create-followup"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Create Follow-up
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-accent/20 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => navigate("/tasks")}
          >
            <CardHeader className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Target className="w-4 h-4" />
                Tasks Due
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold text-accent">{tasksDue7}</div>
                <Badge variant="warning" className="text-xs">7 days</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">upcoming deadlines</p>
            </CardContent>
          </Card>

          <Card 
            className="border-success/20 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => navigate("/clients")}
          >
            <CardHeader className="bg-gradient-to-r from-success to-success/80 text-success-foreground pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Users className="w-4 h-4" />
                Active Clients
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold text-success">12</div>
                <Badge variant="success" className="text-xs">+2 new</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => navigate("/invoices/new")}
                className="h-20 text-left flex-col items-start justify-center"
                variant="outline"
              >
                <FileText className="w-6 h-6 mb-2 text-primary" />
                <div>
                  <p className="font-medium">Create Invoice</p>
                  <p className="text-xs text-muted-foreground">Generate new invoice</p>
                </div>
              </Button>
              <Button 
                onClick={() => navigate("/tasks")}
                className="h-20 text-left flex-col items-start justify-center"
                variant="outline"
              >
                <Target className="w-6 h-6 mb-2 text-accent" />
                <div>
                  <p className="font-medium">Add Task</p>
                  <p className="text-xs text-muted-foreground">Track project work</p>
                </div>
              </Button>
              <Button 
                onClick={() => navigate("/clients")}
                className="h-20 text-left flex-col items-start justify-center"
                variant="outline"
              >
                <Users className="w-6 h-6 mb-2 text-success" />
                <div>
                  <p className="font-medium">Add Client</p>
                  <p className="text-xs text-muted-foreground">Expand your network</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Feed */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {messageLog.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border-l-4 border-l-primary">
                  <div>
                    <div className="font-medium capitalize">{m.related_type} · {m.template_used}</div>
                    <div className="text-sm text-muted-foreground">via {m.channel}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{format(new Date(m.sent_at), "PP p")}</div>
                </div>
              ))}
              {messageLog.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start creating invoices and tasks to see activity here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Focus */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                Today's Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Due Today</div>
                <div className="space-y-2">
                  {dueToday.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <div className="font-medium text-sm">{t.title}</div>
                      <Badge 
                        variant="success" 
                        className="cursor-pointer text-xs" 
                        onClick={() => handleMarkDone(t.id)}
                      >
                        Mark Done
                      </Badge>
                    </div>
                  ))}
                  {dueToday.length === 0 && (
                    <div className="text-sm text-muted-foreground p-2">No items today.</div>
                  )}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Overdue</div>
                <div className="space-y-2">
                  {overdueTasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <div className="font-medium text-sm">{t.title}</div>
                      <Badge variant="warning" className="cursor-pointer text-xs">
                        Send Reminder
                      </Badge>
                    </div>
                  ))}
                  {overdueTasks.length === 0 && (
                    <div className="text-sm text-muted-foreground p-2">All clear! 🎉</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Follow-up Modal */}
        <QuickFollowupModal
          isOpen={quickFollowupModal}
          onClose={() => setQuickFollowupModal(false)}
        />
      </div>
    </>
  );
};

export default Index;
