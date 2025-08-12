import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Plus, List, LayoutGrid, Filter, Search } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { tasks_all, projects_all, clients_all, update_task, create_message_log } from "@/data/collections";
import { useToast } from "@/hooks/use-toast";
import AddTaskModal from "@/components/AddTaskModal";
import { useNavigate } from "react-router-dom";

const TaskCard = ({ task, onMarkDone, projects, clients }: { task: any; onMarkDone: (id: string) => void; projects: any[]; clients: any[] }) => {
  const project = projects.find((p: any) => p.id === task.project_id);
  const client = clients.find((c: any) => c.id === project?.client_id);
  
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium">{task.title}</h4>
            <Badge variant={task.is_billable ? "default" : "secondary"}>
              {task.is_billable ? "₹ Billable" : "Free"}
            </Badge>
          </div>
          
          {project && (
            <p className="text-sm text-muted-foreground">{project.name}</p>
          )}
          
          {client && (
            <p className="text-xs text-muted-foreground">{client.name}</p>
          )}
          
          {task.due_date && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Due: {new Date(task.due_date).toLocaleDateString()}
              </span>
              {task.status === "open" && (
                <Button size="sm" variant="outline" onClick={() => onMarkDone(task.id)}>
                  Mark Done
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function Tasks() {
  const { data: tasks = [], refetch: refetchTasks } = useQuery({ queryKey: ["tasks_all"], queryFn: tasks_all });
  const { data: projects = [] } = useQuery({ queryKey: ["projects_all"], queryFn: projects_all });
  const { data: clients = [] } = useQuery({ queryKey: ["clients_all"], queryFn: clients_all });
  
  const [view, setView] = useState<"list" | "kanban">("list");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const filteredTasks = tasks.filter((task: any) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (projectFilter !== "all" && task.project_id !== projectFilter) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleMarkDone = async (taskId: string) => {
    try {
      await update_task(taskId, { status: "done" });
      await create_message_log({
        related_type: "task",
        related_id: taskId,
        channel: "whatsapp",
        template_used: "task_completed",
        outcome: "completed"
      });
      await refetchTasks();
      queryClient.invalidateQueries({ queryKey: ["tasks_all"] });
      toast({ title: "Task marked as done" });
    } catch (error) {
      toast({ title: "Error updating task", variant: "destructive" });
    }
  };

  const kanbanColumns = {
    today: filteredTasks.filter((t: any) => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString()),
    thisWeek: filteredTasks.filter((t: any) => {
      if (!t.due_date) return false;
      const taskDate = new Date(t.due_date);
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return taskDate > today && taskDate <= weekFromNow;
    }),
    later: filteredTasks.filter((t: any) => {
      if (!t.due_date) return true;
      const taskDate = new Date(t.due_date);
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return taskDate > weekFromNow && t.status === "open";
    }),
    done: filteredTasks.filter((t: any) => t.status === "done")
  };

  const getProjectName = (projectId?: string) => {
    return projects.find((p: any) => p.id === projectId)?.name || "-";
  };

  const getClientName = (projectId?: string) => {
    const project = projects.find((p: any) => p.id === projectId);
    return clients.find((c: any) => c.id === project?.client_id)?.name || "-";
  };

  return (
    <div className="space-y-6">
      <SEO title="HustleHub — Tasks" description="Manage tasks and projects with list and kanban views." />
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks & Projects</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex items-center gap-2 flex-1 min-w-64">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>

              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("kanban")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List View */}
      {view === "list" && (
        <Card>
          <CardHeader>
            <CardTitle>Tasks List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Billable</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task: any) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>{getProjectName(task.project_id)}</TableCell>
                    <TableCell>{getClientName(task.project_id)}</TableCell>
                    <TableCell>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={task.is_billable ? "default" : "secondary"}>
                        {task.is_billable ? "₹ Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={task.status === "done" ? "secondary" : "default"}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.status === "open" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkDone(task.id)}
                        >
                          Mark Done
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Today</h3>
              <Badge variant="secondary">{kanbanColumns.today.length}</Badge>
            </div>
            <div className="space-y-3">
              {kanbanColumns.today.map((task: any) => (
                <TaskCard key={task.id} task={task} onMarkDone={handleMarkDone} projects={projects} clients={clients} />
              ))}
            </div>
          </div>

          {/* This Week Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">This Week</h3>
              <Badge variant="secondary">{kanbanColumns.thisWeek.length}</Badge>
            </div>
            <div className="space-y-3">
              {kanbanColumns.thisWeek.map((task: any) => (
                <TaskCard key={task.id} task={task} onMarkDone={handleMarkDone} projects={projects} clients={clients} />
              ))}
            </div>
          </div>

          {/* Later Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Later</h3>
              <Badge variant="secondary">{kanbanColumns.later.length}</Badge>
            </div>
            <div className="space-y-3">
              {kanbanColumns.later.map((task: any) => (
                <TaskCard key={task.id} task={task} onMarkDone={handleMarkDone} projects={projects} clients={clients} />
              ))}
            </div>
          </div>

          {/* Done Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Done</h3>
              <Badge variant="secondary">{kanbanColumns.done.length}</Badge>
            </div>
            <div className="space-y-3">
              {kanbanColumns.done.map((task: any) => (
                <TaskCard key={task.id} task={task} onMarkDone={handleMarkDone} projects={projects} clients={clients} />
              ))}
            </div>
          </div>
        </div>
      )}

      <AddTaskModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSuccess={() => {
          refetchTasks();
          queryClient.invalidateQueries({ queryKey: ["tasks_all"] });
        }} 
      />
    </div>
  );
}