import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import SEO from "@/components/SEO";
import QuickActionsWidget from "@/components/QuickActionsWidget";
import { format } from "date-fns";

const currency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const Index = () => {
  const navigate = useNavigate();
  const thisMonthPaid = useAppStore((s) => s.thisMonthPaid());
  const overdueAmount = useAppStore((s) => s.overdueAmount());
  const tasks = useAppStore((s) => s.tasks);
  const tasksDue7 = useAppStore((s) => s.tasksDue7d());
  const messageLog = useAppStore((s) => s.messageLog).slice(0,10);
  const invoices = useAppStore((s) => s.invoices);

  const dueToday = tasks.filter(t => t.status === "open" && t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString());
  const overdueTasks = tasks.filter(t => t.status === "open" && t.dueDate && new Date(t.dueDate) < new Date());
  const overdueCount = invoices.filter(i => i.status === "overdue").length;

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
                  <div className="font-medium capitalize">{m.related} · {m.template}</div>
                  <div className="text-sm text-muted-foreground">via {m.channel}</div>
                </div>
                <div className="text-sm text-muted-foreground">{format(new Date(m.sentAt), "PP p")}</div>
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
                    <Badge>Mark Done</Badge>
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
