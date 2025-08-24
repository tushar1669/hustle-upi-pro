import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { Plus, List, LayoutGrid, Filter, Search, Edit, CalendarIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { tasks_all, projects_all, clients_all, update_task, create_message_log } from "@/data/collections";
import { useToast } from "@/hooks/use-toast";
import { CACHE_KEYS } from "@/hooks/useCache";
import AddTaskModal from "@/components/AddTaskModal";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Task Edit Modal Component
const TaskEditModal = ({ 
  isOpen, 
  onClose, 
  task, 
  onSaved 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  task: any; 
  onSaved: () => void; 
}) => {
  const [title, setTitle] = useState(task?.title || "");
  const [dueDate, setDueDate] = useState<Date | undefined>(task?.due_date ? new Date(task.due_date) : undefined);
  const [isBillable, setIsBillable] = useState(task?.is_billable || false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!task) return;
    
    setSaving(true);
    try {
      await update_task(task.id, {
        title,
        due_date: dueDate ? dueDate.toISOString().split('T')[0] : null,
        is_billable: isBillable
      });
      
      toast({ title: "Task updated" });
      onSaved();
      onClose();
    } catch (error: any) {
      toast({ 
        title: "Error updating task", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>
          
          <div>
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="billable"
              checked={isBillable}
              onCheckedChange={(checked) => setIsBillable(checked === true)}
            />
            <Label htmlFor="billable">Billable</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !title.trim()}
            data-testid="task-edit-save"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Draggable Task Card Component  
const DraggableTaskCard = ({ 
  task, 
  onMarkDone, 
  onEdit, 
  projects, 
  clients 
}: { 
  task: any; 
  onMarkDone: (id: string) => void; 
  onEdit: (task: any) => void;
  projects: any[]; 
  clients: any[]; 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const project = projects.find((p: any) => p.id === task.project_id);
  const client = clients.find((c: any) => c.id === project?.client_id);
  
  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className="cursor-pointer hover:shadow-md transition-shadow"
      data-testid="task-card"
      data-id={task.id}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium">{task.title}</h4>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                data-testid="task-edit-open"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Badge variant={task.is_billable ? "default" : "secondary"}>
                {task.is_billable ? "₹ Billable" : "Free"}
              </Badge>
            </div>
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
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkDone(task.id);
                  }}
                >
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

// Static Task Card for List View
const TaskCard = ({ 
  task, 
  onMarkDone, 
  onEdit, 
  projects, 
  clients 
}: { 
  task: any; 
  onMarkDone: (id: string) => void; 
  onEdit: (task: any) => void;
  projects: any[]; 
  clients: any[]; 
}) => {
  const project = projects.find((p: any) => p.id === task.project_id);
  const client = clients.find((c: any) => c.id === project?.client_id);
  
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="task-card" data-id={task.id}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium">{task.title}</h4>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(task)}
                data-testid="task-edit-open"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Badge variant={task.is_billable ? "default" : "secondary"}>
                {task.is_billable ? "₹ Billable" : "Free"}
              </Badge>
            </div>
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
  const { data: tasks = [] } = useQuery({ queryKey: CACHE_KEYS.TASKS, queryFn: tasks_all });
  const { data: projects = [] } = useQuery({ queryKey: CACHE_KEYS.PROJECTS, queryFn: projects_all });
  const { data: clients = [] } = useQuery({ queryKey: CACHE_KEYS.CLIENTS, queryFn: clients_all });
  
  const [view, setView] = useState<"list" | "kanban">("list");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const filteredTasks = tasks.filter((task: any) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (projectFilter !== "all" && task.project_id !== projectFilter) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleMarkDone = async (taskId: string) => {
    try {
      await update_task(taskId, { status: "done" });
      
      // Log task completion
      await create_message_log({
        related_type: "task",
        related_id: taskId,
        channel: "whatsapp",
        template_used: "task_completed",
        outcome: "ok"
      });
      
      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.TASKS });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DASHBOARD });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.MESSAGES });
      
      toast({ title: "✅ Task marked as done" });
    } catch (error: any) {
      console.error('Task update error:', error);
      toast({ title: "❌ Error updating task", description: error.message || "Unknown error", variant: "destructive" });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;
    
    // Map column IDs to task statuses
    const statusMap: { [key: string]: string } = {
      'open': 'open',
      'in_progress': 'open', // We don't have in_progress status in our schema, map to open
      'done': 'done'
    };

    const mappedStatus = statusMap[newStatus] || newStatus;

    try {
      await update_task(taskId, { status: mappedStatus as "open" | "done" });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.TASKS });
      toast({ title: "Task status updated" });
    } catch (error: any) {
      toast({ title: "Error updating task", description: error.message, variant: "destructive" });
    }
  };

  const kanbanColumns = {
    open: filteredTasks.filter((t: any) => t.status === "open"),
    done: filteredTasks.filter((t: any) => t.status === "done")
  };

  const getProjectName = (projectId?: string) => {
    return projects.find((p: any) => p.id === projectId)?.name || "-";
  };

  const getClientName = (projectId?: string) => {
    const project = projects.find((p: any) => p.id === projectId);
    return clients.find((c: any) => c.id === project?.client_id)?.name || "-";
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
  };

  const handleTaskSaved = () => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.TASKS });
    setEditingTask(null);
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
                  <TableRow key={task.id} data-testid="task-card" data-id={task.id}>
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
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTask(task)}
                          data-testid="task-edit-open"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {task.status === "open" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkDone(task.id)}
                          >
                            Mark Done
                          </Button>
                        )}
                      </div>
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Open Column */}
            <SortableContext 
              items={kanbanColumns.open.map((task: any) => task.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3" data-testid="kanban-col-open">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Open</h3>
                  <Badge variant="secondary">{kanbanColumns.open.length}</Badge>
                </div>
                <div className="space-y-3 min-h-[200px] p-4 border-2 border-dashed border-muted rounded-lg droppable" id="open">
                  {kanbanColumns.open.map((task: any) => (
                    <DraggableTaskCard 
                      key={task.id} 
                      task={task} 
                      onMarkDone={handleMarkDone} 
                      onEdit={handleEditTask}
                      projects={projects} 
                      clients={clients} 
                    />
                  ))}
                </div>
              </div>
            </SortableContext>

            {/* Done Column */}
            <SortableContext 
              items={kanbanColumns.done.map((task: any) => task.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3" data-testid="kanban-col-done">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Done</h3>
                  <Badge variant="secondary">{kanbanColumns.done.length}</Badge>
                </div>
                <div className="space-y-3 min-h-[200px] p-4 border-2 border-dashed border-muted rounded-lg droppable" id="done">
                  {kanbanColumns.done.map((task: any) => (
                    <DraggableTaskCard 
                      key={task.id} 
                      task={task} 
                      onMarkDone={handleMarkDone} 
                      onEdit={handleEditTask}
                      projects={projects} 
                      clients={clients} 
                    />
                  ))}
                </div>
              </div>
            </SortableContext>
          </div>

          <DragOverlay>
            {activeId ? (
              <TaskCard 
                task={filteredTasks.find((t: any) => t.id === activeId)} 
                onMarkDone={handleMarkDone} 
                onEdit={handleEditTask}
                projects={projects} 
                clients={clients} 
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <AddTaskModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: CACHE_KEYS.TASKS });
          queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DASHBOARD });
          queryClient.invalidateQueries({ queryKey: CACHE_KEYS.MESSAGES });
        }} 
      />

      <TaskEditModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        onSaved={handleTaskSaved}
      />
    </div>
  );
}