import { useEffect, useMemo, useState } from "react";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Edit3, List, Layout, Check, Loader2 } from "lucide-react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import AddTaskModal from "@/components/AddTaskModal";

import {
  tasks_all,
  projects_all,
  clients_all,
  update_task,
  create_message_log,
} from "@/data/collections";

import { CACHE_KEYS } from "@/hooks/useCache";

// dnd-kit
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";

// -----------------------------------------------------------
// Helpers / types (keep types broad to avoid ripple TS errors)
// -----------------------------------------------------------

type TaskItem = {
  id: string;
  title: string;
  status: "open" | "done" | string;
  project_id?: string | null;
  due_date?: string | null;
  is_billable?: boolean | null;
};

type ProjectItem = { id: string; name: string; client_id?: string | null };
type ClientItem = { id: string; name: string };

// -----------------------------------------------------------
// Inline Task Edit Modal (no new file)
// -----------------------------------------------------------
function TaskEditModal({
  isOpen,
  onClose,
  task,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [isBillable, setIsBillable] = useState(false);
  const [projectId, setProjectId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const { data: projects = [] } = useQuery({ queryKey: CACHE_KEYS.PROJECTS, queryFn: projects_all });

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDueDate(task.due_date ? task.due_date.split("T")[0] : "");
      setIsBillable(!!task.is_billable);
      setProjectId(task.project_id || "");
    }
  }, [task]);

  const handleSave = async () => {
    if (!task) return;
    setSaving(true);
    try {
      await update_task(task.id, {
        title,
        project_id: projectId || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        is_billable: isBillable,
      } as any);
      // Invalidate both tasks and projects cache
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.TASKS });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PROJECTS });
      toast({ title: "Task updated" });
      onSaved();
      onClose();
    } catch (e: any) {
      toast({
        title: "Error updating task",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="t-title">Title</Label>
            <Input
              id="t-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>

          <div>
            <Label htmlFor="t-project">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No project</SelectItem>
                {(projects as ProjectItem[]).map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

            <div>
              <Label htmlFor="t-due">Due Date</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="t-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="max-w-[200px]"
                  min={new Date().toISOString().split('T')[0]}
                />
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

          <div className="flex items-center gap-2">
            <input
              id="t-billable"
              type="checkbox"
              checked={isBillable}
              onChange={(e) => setIsBillable(e.target.checked)}
            />
            <Label htmlFor="t-billable">Billable</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button data-testid="task-edit-save" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -----------------------------------------------------------
// Sortable Kanban Card
// -----------------------------------------------------------
function DraggableTaskCard({
  task,
  onEdit,
  onMarkDone,
}: {
  task: TaskItem;
  onEdit: (t: TaskItem) => void;
  onMarkDone: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border bg-card p-3 shadow-sm flex items-start justify-between gap-2"
      data-testid="task-card"
      data-id={task.id}
      {...attributes}
      {...listeners}
    >
      <div className="space-y-1">
        <div className="font-medium">{task.title}</div>
        <div className="text-xs text-muted-foreground">
          {task.due_date ? `Due: ${new Date(task.due_date).toLocaleDateString()}` : "No due date"}
        </div>
        {task.is_billable ? (
          <Badge variant="default" className="text-[10px]">₹ Billable</Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px]">Free</Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          data-testid="task-edit-open"
        >
          <Edit3 className="h-4 w-4" />
        </Button>
        {task.status === "open" && (
          <Button size="sm" variant="outline" onClick={() => onMarkDone(task.id)}>
            <Check className="h-4 w-4 mr-1" />
            Done
          </Button>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------
// Droppable Column
// -----------------------------------------------------------
function KanbanColumn({
  id,
  title,
  items,
  children,
}: {
  id: "open" | "done";
  title: string;
  items: TaskItem[];
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: `col-${id}` });

  return (
    <div className="flex-1 space-y-3" ref={setNodeRef} data-testid={`kanban-col-${id}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{title}</div>
        <Badge variant="outline">{items.length}</Badge>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// -----------------------------------------------------------
// Main Page
// -----------------------------------------------------------
export default function Tasks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({ queryKey: CACHE_KEYS.TASKS, queryFn: tasks_all });
  const { data: projects = [] } = useQuery({ queryKey: CACHE_KEYS.PROJECTS, queryFn: projects_all as any });
  const { data: clients = [] } = useQuery({ queryKey: CACHE_KEYS.CLIENTS, queryFn: clients_all });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const [view, setView] = useState<"list" | "kanban">("kanban");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "done">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Filters
  const filteredTasks: TaskItem[] = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (tasks as TaskItem[]).filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (projectFilter !== "all" && t.project_id !== projectFilter) return false;
      if (s && !t.title.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [tasks, search, statusFilter, projectFilter]);

  const columnItems = useMemo(() => {
    const open = filteredTasks.filter((t) => t.status === "open");
    const done = filteredTasks.filter((t) => t.status === "done");
    return { open, done };
  }, [filteredTasks]);

  const getProjectName = (projectId?: string | null) =>
    (projects as ProjectItem[]).find((p) => p.id === projectId)?.name ?? "-";

  const getClientNameForProject = (projectId?: string | null) => {
    const p = (projects as ProjectItem[]).find((x) => x.id === projectId);
    return (clients as ClientItem[]).find((c) => c.id === p?.client_id)?.name ?? "-";
  };

  // Actions
  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.TASKS });
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DASHBOARD });
  };

  const handleMarkDone = async (taskId: string) => {
    try {
      await update_task(taskId, { status: "done" } as any);
      await create_message_log({
        related_type: "task" as any,
        related_id: taskId,
        channel: "whatsapp" as any,
        template_used: "task_completed",
        outcome: "ok",
      });
      invalidateTasks();
      toast({ title: "Task marked as done" });
    } catch (e: any) {
      toast({ title: "Error updating task", description: e?.message ?? "Unknown error", variant: "destructive" });
    }
  };

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    // no-op: reserve if we add a drag overlay later
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over) return;

    const taskId = String(active.id);

    // If dropped over a column droppable, over.id will be "col-open" or "col-done"
    let newStatus: "open" | "done" | null = null;
    const overId = String(over.id);
    if (overId.startsWith("col-")) {
      newStatus = overId.replace("col-", "") as "open" | "done";
    } else {
      // Dropped over another task card; figure out which column that card belongs to
      const inOpen = columnItems.open.some((t) => t.id === overId);
      const inDone = columnItems.done.some((t) => t.id === overId);
      if (inOpen) newStatus = "open";
      if (inDone) newStatus = "done";
    }

    if (!newStatus) return;

    try {
      await update_task(taskId, { status: newStatus } as any);
      invalidateTasks();
      toast({ title: "Task status updated" });
    } catch (e: any) {
      toast({ title: "Error updating task", description: e?.message ?? "Unknown error", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="HustleHub — Tasks" description="Manage your tasks in list or kanban view." />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <Button onClick={() => setShowAddModal(true)}>Add Task</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:max-w-xs"
            />

            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>

            <Select value={projectFilter} onValueChange={(v) => setProjectFilter(v)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {(projects as ProjectItem[]).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant={view === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("list")}
                title="List"
              >
                <List className="h-4 w-4 mr-1" /> List
              </Button>
              <Button
                variant={view === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("kanban")}
                title="Kanban"
              >
                <Layout className="h-4 w-4 mr-1" /> Kanban
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
                  <TableHead>Due</TableHead>
                  <TableHead>Billable</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((t) => (
                  <TableRow key={t.id} data-testid="task-card" data-id={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell>{getProjectName(t.project_id)}</TableCell>
                    <TableCell>{getClientNameForProject(t.project_id)}</TableCell>
                    <TableCell>{t.due_date ? new Date(t.due_date).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>{t.is_billable ? "₹ Yes" : "No"}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === "done" ? "secondary" : "default"}>{t.status}</Badge>
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingTask(t)}
                        data-testid="task-edit-open"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                       {t.status === "open" && (
                         <Button size="sm" variant="outline" onClick={() => handleMarkDone(t.id)} data-testid="task-mark-done">
                           <Check className="h-4 w-4 mr-1" />
                           Done
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
        <Card>
          <CardHeader>
            <CardTitle>Kanban</CardTitle>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KanbanColumn id="open" title="Open" items={columnItems.open}>
                  <SortableContext
                    // items are the ids of cards in this column
                    items={columnItems.open.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {columnItems.open.map((t) => (
                      <DraggableTaskCard
                        key={t.id}
                        task={t}
                        onEdit={(task) => setEditingTask(task)}
                        onMarkDone={handleMarkDone}
                      />
                    ))}
                  </SortableContext>
                </KanbanColumn>

                <KanbanColumn id="done" title="Done" items={columnItems.done}>
                  <SortableContext
                    items={columnItems.done.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {columnItems.done.map((t) => (
                      <DraggableTaskCard
                        key={t.id}
                        task={t}
                        onEdit={(task) => setEditingTask(task)}
                        onMarkDone={handleMarkDone}
                      />
                    ))}
                  </SortableContext>
                </KanbanColumn>
              </div>
            </DndContext>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          // refresh lists and dashboard metrics
          queryClient.invalidateQueries({ queryKey: CACHE_KEYS.TASKS });
          queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DASHBOARD });
        }}
      />

      <TaskEditModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: CACHE_KEYS.TASKS });
        }}
      />
    </div>
  );
}
