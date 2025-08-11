import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { useState } from "react";
import { Plus, List, LayoutGrid, Filter, Search } from "lucide-react";

const TaskCard = ({ task, onMarkDone }: { task: any; onMarkDone: (id: string) => void }) => {
  const clients = useAppStore((s) => s.clients);
  const projects = useAppStore((s) => s.projects);
  
  const project = projects.find(p => p.id === task.projectId);
  const client = clients.find(c => c.id === project?.clientId);
  
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium">{task.title}</h4>
            <Badge variant={task.isBillable ? "default" : "secondary"}>
              {task.isBillable ? "₹ Billable" : "Free"}
            </Badge>
          </div>
          
          {project && (
            <p className="text-sm text-muted-foreground">{project.name}</p>
          )}
          
          {client && (
            <p className="text-xs text-muted-foreground">{client.name}</p>
          )}
          
          {task.dueDate && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Due: {new Date(task.dueDate).toLocaleDateString()}
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
  const tasks = useAppStore((s) => s.tasks);
  const projects = useAppStore((s) => s.projects);
  const clients = useAppStore((s) => s.clients);
  const toggleTaskDone = useAppStore((s) => s.toggleTaskDone);
  
  const [view, setView] = useState<"list" | "kanban">("list");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (projectFilter !== "all" && task.projectId !== projectFilter) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const kanbanColumns = {
    today: filteredTasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString()),
    thisWeek: filteredTasks.filter(t => {
      if (!t.dueDate) return false;
      const taskDate = new Date(t.dueDate);
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return taskDate > today && taskDate <= weekFromNow;
    }),
    later: filteredTasks.filter(t => {
      if (!t.dueDate) return true;
      const taskDate = new Date(t.dueDate);
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return taskDate > weekFromNow && t.status === "open";
    }),
    done: filteredTasks.filter(t => t.status === "done")
  };

  const getProjectName = (projectId?: string) => {
    return projects.find(p => p.id === projectId)?.name || "-";
  };

  const getClientName = (projectId?: string) => {
    const project = projects.find(p => p.id === projectId);
    return clients.find(c => c.id === project?.clientId)?.name || "-";
  };

  return (
    <div className="space-y-6">
      <SEO title="HustleHub — Tasks" description="Manage tasks and projects with list and kanban views." />
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks & Projects</h1>
        <Button>
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
                  {projects.map((project) => (
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
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>{getProjectName(task.projectId)}</TableCell>
                    <TableCell>{getClientName(task.projectId)}</TableCell>
                    <TableCell>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={task.isBillable ? "default" : "secondary"}>
                        {task.isBillable ? "₹ Yes" : "No"}
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
                          onClick={() => toggleTaskDone(task.id)}
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
              {kanbanColumns.today.map((task) => (
                <TaskCard key={task.id} task={task} onMarkDone={toggleTaskDone} />
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
              {kanbanColumns.thisWeek.map((task) => (
                <TaskCard key={task.id} task={task} onMarkDone={toggleTaskDone} />
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
              {kanbanColumns.later.map((task) => (
                <TaskCard key={task.id} task={task} onMarkDone={toggleTaskDone} />
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
              {kanbanColumns.done.map((task) => (
                <TaskCard key={task.id} task={task} onMarkDone={toggleTaskDone} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}