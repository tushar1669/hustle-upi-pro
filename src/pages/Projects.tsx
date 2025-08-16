import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";
import { FolderKanban, Plus, Users, Clock } from "lucide-react";

const Projects = () => {
  return (
    <div className="space-y-6">
      <SEO title="Projects — HustleHub" description="Manage your business projects and track progress" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground">Organize and track your client projects</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      <div className="text-center py-12">
        <FolderKanban className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Projects Coming Soon</h3>
        <p className="text-muted-foreground mb-4">
          Organize your work by client projects, track progress, and manage deliverables.
        </p>
        <Button variant="outline">
          Learn More
        </Button>
      </div>
    </div>
  );
};

export default Projects;