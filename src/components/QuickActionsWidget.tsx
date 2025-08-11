import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { Plus, FileText, Users, CheckSquare, DollarSign } from "lucide-react";

const currency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function QuickActionsWidget() {
  const navigate = useNavigate();
  const clients = useAppStore((s) => s.clients);
  const tasks = useAppStore((s) => s.tasks);
  const invoices = useAppStore((s) => s.invoices);
  const thisMonthPaid = useAppStore((s) => s.thisMonthPaid());

  const recentClients = clients.slice(0, 3);
  const openTasks = tasks.filter(t => t.status === "open").slice(0, 3);
  const recentInvoices = invoices.slice(0, 3);
  const recentPayments = invoices.filter(i => i.status === "paid").slice(0, 3);

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
          <Button variant="secondary" onClick={() => navigate("/tasks")} className="h-12">
            <CheckSquare className="h-4 w-4 mr-2" />
            Add Task
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
              {recentClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50">
                  <span className="text-sm">{client.name}</span>
                  <Badge variant="outline" className="text-xs">{client.whatsapp}</Badge>
                </div>
              ))}
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
              {openTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50">
                  <span className="text-sm">{task.title}</span>
                  <Badge variant={task.isBillable ? "default" : "secondary"} className="text-xs">
                    {task.isBillable ? "₹" : "Free"}
                  </Badge>
                </div>
              ))}
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
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50">
                  <span className="text-sm">{invoice.invoiceNumber}</span>
                  <Badge variant={invoice.status === "paid" ? "secondary" : invoice.status === "overdue" ? "destructive" : "default"} className="text-xs">
                    {currency(invoice.totalAmount)}
                  </Badge>
                </div>
              ))}
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
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50">
                  <span className="text-sm">{payment.invoiceNumber}</span>
                  <Badge variant="secondary" className="text-xs">
                    {currency(payment.totalAmount)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}