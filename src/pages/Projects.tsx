import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import SEO from "@/components/SEO";
import AddProjectModal from "@/components/AddProjectModal";
import { FolderKanban, Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { projects_all, clients_all, delete_project } from "@/data/collections";
import { CACHE_KEYS, invalidateProjectCaches } from "@/hooks/useCache";
import { friendlyDeleteError } from "@/lib/supabaseErrors";

const Projects = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProject, setEditProject] = useState<any>(null);
  const [deleteProject, setDeleteProject] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: CACHE_KEYS.PROJECTS,
    queryFn: projects_all
  });

  const { data: clients = [] } = useQuery({
    queryKey: CACHE_KEYS.CLIENTS,
    queryFn: clients_all
  });

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "No client";
    const client = clients.find((c: any) => c.id === clientId);
    return client?.name || "Unknown client";
  };

  const handleEdit = (project: any) => {
    setEditProject(project);
    setShowAddModal(true);
  };

  const handleDelete = async (project: any) => {
    try {
      await delete_project(project.id);
      await invalidateProjectCaches(queryClient);
      toast({ title: "Project deleted successfully" });
      setDeleteProject(null);
    } catch (error: any) {
      const friendlyError = friendlyDeleteError(error, 'project');
      toast({
        title: "Error deleting project",
        description: friendlyError || (error?.message ?? "Something went wrong"),
        variant: "destructive"
      });
    }
  };

  const handleModalSuccess = async () => {
    await invalidateProjectCaches(queryClient);
    setEditProject(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SEO title="Projects — HustleHub" description="Manage your business projects and track progress" />
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-24 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <SEO title="Projects — HustleHub" description="Manage your business projects and track progress" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground">Organize and track your client projects</p>
          </div>
          <Button 
            className="flex items-center gap-2"
            onClick={() => {
              setEditProject(null);
              setShowAddModal(true);
            }}
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-destructive font-medium mb-2">
              Error loading projects
            </div>
            <p className="text-muted-foreground mb-4">
              There was a problem loading your projects. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SEO title="Projects — HustleHub" description="Manage your business projects and track progress" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground">Organize and track your client projects</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => {
            setEditProject(null);
            setShowAddModal(true);
          }}
        >
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderKanban className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first project to organize your work by client and track deliverables.
          </p>
          <Button 
            onClick={() => {
              setEditProject(null);
              setShowAddModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Projects ({projects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Billable</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project: any) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{getClientName(project.client_id)}</TableCell>
                    <TableCell>
                      <Badge variant={project.is_billable ? "default" : "secondary"}>
                        {project.is_billable ? "Billable" : "Non-billable"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(project.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(project)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteProject(project)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AddProjectModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditProject(null);
        }}
        onSuccess={handleModalSuccess}
        editProject={editProject}
      />

      <AlertDialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteProject?.name}"? This action cannot be undone.
              {/* Note: If this project has tasks, they will be unassigned. */}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteProject)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Projects;