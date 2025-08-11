import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/store/useAppStore";
import { Badge } from "@/components/ui/badge";

export default function Tasks() {
  const tasks = useAppStore((s) => s.tasks);

  return (
    <div className="space-y-6">
      <SEO title="HustleHub — Tasks" description="Tasks and projects list view." />
      <Card>
        <CardHeader><CardTitle>Tasks and Projects</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Billable</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{t.isBillable ? "Yes" : "No"}</TableCell>
                  <TableCell><Badge variant={t.status === "done" ? "secondary" : "default"}>{t.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
