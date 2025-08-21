import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Users, CheckSquare, DollarSign, TestTube } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { clients_all, tasks_all, invoices_all, v_dashboard_metrics, update_task, create_message_log } from "@/data/collections";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import AddTaskModal from "@/components/AddTaskModal";
import { CACHE_KEYS, invalidateTaskCaches } from "@/hooks/useCache";
import { qaTestRunner } from "@/qa/testRunner";

const currency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function QuickActionsWidget() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  const { data: clients = [], isLoading: clientsLoading } = useQuery({ 
    queryKey: CACHE_KEYS.CLIENTS, 
    queryFn: clients_all 
  });
  
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({ 
    queryKey: CACHE_KEYS.TASKS, 
    queryFn: tasks_all 
  });
  
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({ 
    queryKey: CACHE_KEYS.INVOICES, 
    queryFn: invoices_all 
  });
  
  const { data: dashboardMetrics } = useQuery({ 
    queryKey: CACHE_KEYS.DASHBOARD, 
    queryFn: v_dashboard_metrics 
  });

  // Filter data for display
  const recentClients = clients.slice(0, 5).reverse();
  
  const today = new Date();
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const openTasks = tasks
    .filter((t: any) => t.status === 'open' && t.due_date && new Date(t.due_date) <= sevenDaysFromNow)
    .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);
    
  const recentInvoices = invoices.slice(0, 5).reverse();
  
  const recentPayments = invoices
    .filter((i: any) => i.status === "paid" && i.paid_date)
    .sort((a: any, b: any) => new Date(b.paid_date).getTime() - new Date(a.paid_date).getTime())
    .slice(0, 5);

  const thisMonthPaid = dashboardMetrics?.this_month_paid || 0;

  const handleMarkTaskDone = async (taskId: string) => {
    try {
      await update_task(taskId, { status: 'done' });
      await create_message_log({
        related_type: 'task',
        related_id: taskId,
        channel: 'whatsapp',
        template_used: 'task_completed',
        outcome: 'ok'
      });
      await invalidateTaskCaches(queryClient);
      toast({ title: "Task marked as done" });
    } catch (error) {
      toast({ title: "Error updating task", variant: "destructive" });
    }
  };

  const handleAddTask = () => {
    setIsAddTaskModalOpen(true);
  };

  const handleTaskCreated = async () => {
    await invalidateTaskCaches(queryClient);
  };

  const handleAddClient = () => {
    navigate("/clients", { state: { openModal: true } });
  };

  const handleCreateFollowUp = () => {
    navigate("/follow-ups");
  };

  const handleRunSanityV2 = async () => {
    try {
      const summary = await qaTestRunner.runSanityV2({ fix: false });
      
      // Show toast with results
      toast({
        title: "QA completed",
        description: `${summary.passed} passed, ${summary.failed} failed, ${summary.warnings} warnings — see console for details`,
        duration: 5000,
      });

      // Add recent activity entry
      await create_message_log({
        related_type: 'qa' as any,
        related_id: crypto.randomUUID(),
        channel: 'email' as any,
        template_used: 'qa_check',
        outcome: `Sanity V2: ${summary.passed}/${summary.totalTests} passed`
      });

    } catch (error) {
      toast({
        title: "QA failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => navigate("/invoices/new")} className="h-12">
            <FileText className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
          <Button variant="secondary" onClick={handleAddTask} className="h-12">
            <CheckSquare className="h-4 w-4 mr-2" />
            Add Task
          </Button>
          <Button variant="outline" onClick={handleAddClient} className="h-12">
            <Users className="h-4 w-4 mr-2" />
            Add Client
          </Button>
          <Button variant="outline" onClick={handleCreateFollowUp} className="h-12">
            <Plus className="h-4 w-4 mr-2" />
            Create Follow-up
          </Button>
        </div>

        {/* Quick Lists */}
        <div className="space-y-4">
          {/* Recent Clients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Recent Clients
              </h4>
              <Button variant="ghost" size="sm" onClick={() => navigate("/clients")}>
                View All
              </Button>
            </div>
            <div className="space-y-1">
              {clientsLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : recentClients.length === 0 ? (
                <div className="text-sm text-muted-foreground">No clients yet</div>
              ) : (
                recentClients.map((client: any) => (
                  <div key={client.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50">
                    <span className="text-sm">{client.name}</span>
                    <Badge variant="outline" className="text-xs">{client.whatsapp}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Open Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Open Tasks
              </h4>
              <Button variant="ghost" size="sm" onClick={() => navigate("/tasks")}>
                View All
              </Button>
            </div>
            <div className="space-y-1">
              {tasksLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : openTasks.length === 0 ? (
                <div className="text-sm text-muted-foreground">No tasks due</div>
              ) : (
                openTasks.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50">
                    <div className="flex-1">
                      <span className="text-sm">{task.title}</span>
                      {task.due_date && (
                        <div className="text-xs text-muted-foreground">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={task.is_billable ? "default" : "secondary"} className="text-xs">
                        {task.is_billable ? "₹" : "Free"}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleMarkTaskDone(task.id)}
                        className="h-6 px-2 text-xs"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Invoices */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Recent Invoices
              </h4>
              <Button variant="ghost" size="sm" onClick={() => navigate("/invoices")}>
                View All
              </Button>
            </div>
            <div className="space-y-1">
              {invoicesLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : recentInvoices.length === 0 ? (
                <div className="text-sm text-muted-foreground">No invoices yet</div>
              ) : (
                recentInvoices.map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50">
                    <span className="text-sm">{invoice.invoice_number}</span>
                    <Badge variant={invoice.status === "paid" ? "secondary" : invoice.status === "overdue" ? "destructive" : "default"} className="text-xs">
                      {currency(invoice.total_amount)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Recent Payments
              </h4>
              <span className="text-xs text-muted-foreground">{currency(thisMonthPaid)} this month</span>
            </div>
            <div className="space-y-1">
              {invoicesLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : recentPayments.length === 0 ? (
                <div className="text-sm text-muted-foreground">No payments yet</div>
              ) : (
                recentPayments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50">
                    <span className="text-sm">{payment.invoice_number}</span>
                    <Badge variant="secondary" className="text-xs">
                      {currency(payment.total_amount)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* QA Testing Section */}
        <div className="pt-4 border-t">
          <Button 
            onClick={handleRunSanityV2} 
            variant="outline" 
            size="sm"
            className="w-full h-auto flex items-center gap-2 p-3 text-xs"
          >
            <TestTube className="w-4 h-4" />
            <span>Run QA (Sanity v2)</span>
          </Button>
        </div>
      </CardContent>
      
      <AddTaskModal 
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onSuccess={handleTaskCreated}
      />
    </Card>
  );
}