import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import QuickActionsWidget from "@/components/QuickActionsWidget";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { message_log_recent, tasks_all, update_task, v_dashboard_metrics } from "@/data/collections";

const currency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const Index = () => {
  const navigate = useNavigate();

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
  };

  return (
    <div className="space-y-6">
      <SEO title="HustleHub — Dashboard" description="Overview of invoices, tasks and follow-ups." />
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>This Month</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-3xl font-bold">{currency(thisMonthPaid)}</div>
            <Badge variant="secondary">+12% vs last month</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Overdue</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-3xl font-bold">{currency(overdueAmount)}</div>
            <Badge variant="destructive">{overdueCount} invoices</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tasks Due in 7d</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-3xl font-bold">{tasksDue7}</div>
            <div className="text-sm text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {messageLog.map((m) => (
              <div key={m.id} className="flex items-center justify-between border-b last:border-none pb-3">
                <div>
                  <div className="font-medium capitalize">{m.related_type} · {m.template_used}</div>
                  <div className="text-sm text-muted-foreground">via {m.channel}</div>
                </div>
                <div className="text-sm text-muted-foreground">{format(new Date(m.sent_at), "PP p")}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <QuickActionsWidget />

          <Card>
            <CardHeader>
              <CardTitle>Today’s Focus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">Due Today</div>
              <div className="space-y-2">
                {dueToday.map((t) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div className="font-medium">{t.title}</div>
                    <Badge onClick={() => handleMarkDone(t.id)}>Mark Done</Badge>
                  </div>
                ))}
                {dueToday.length === 0 && <div className="text-sm text-muted-foreground">No items today.</div>}
              </div>
              <div className="text-sm text-muted-foreground pt-2">Overdue</div>
              <div className="space-y-2">
                {overdueTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div className="font-medium">{t.title}</div>
                    <Badge variant="destructive">Send Reminder</Badge>
                  </div>
                ))}
                {overdueTasks.length === 0 && <div className="text-sm text-muted-foreground">All clear.</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
