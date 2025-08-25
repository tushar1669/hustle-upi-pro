import SEO from "@/components/SEO";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  savings_goals_all,
  create_savings_goal,
  update_savings_goal,
} from "@/data/collections";
import { useToast } from "@/hooks/use-toast";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const currency = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function SavingsGoalsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["savings_goals_all"],
    queryFn: savings_goals_all,
  });

  const [openCreate, setOpenCreate] = useState(false);
  const [openAddFunds, setOpenAddFunds] = useState<null | string>(null); // goal id
  const [form, setForm] = useState({
    title: "",
    target_amount: "",
    target_date: "",
    type: "",
  });
  const [addAmount, setAddAmount] = useState("");

  const totals = goals.reduce(
    (acc: any, g: any) => {
      acc.target += Number(g.target_amount || 0);
      acc.saved += Number(g.saved_amount || 0);
      return acc;
    },
    { target: 0, saved: 0 }
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create_savings_goal({
        title: form.title.trim(),
        target_amount: Number(form.target_amount || 0),
        target_date: form.target_date ? new Date(form.target_date).toISOString().slice(0, 10) : null,
        type: form.type || null,
      });
      setOpenCreate(false);
      setForm({ title: "", target_amount: "", target_date: "", type: "" });
      await queryClient.invalidateQueries({ queryKey: ["savings_goals_all"] });
      toast({ title: "Goal created" });
    } catch (err: any) {
      toast({ title: "Error creating goal", description: err?.message, variant: "destructive" });
    }
  };

  const handleAddFunds = async () => {
    const goal = goals.find((g: any) => g.id === openAddFunds);
    if (!goal) return;
    const inc = Number(addAmount || 0);
    if (Number.isNaN(inc) || inc <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    try {
      await update_savings_goal(goal.id, {
        saved_amount: Number(goal.saved_amount || 0) + inc,
      });
      setOpenAddFunds(null);
      setAddAmount("");
      await queryClient.invalidateQueries({ queryKey: ["savings_goals_all"] });
      toast({ title: "Funds added" });
    } catch (err: any) {
      toast({ title: "Error adding funds", description: err?.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="HustleHub — Savings Goals" description="Track and grow your savings goals." />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Savings Goals</h1>
        <Button onClick={() => setOpenCreate(true)}>New Goal</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Active Goals</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{goals.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Target</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{currency(totals.target)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Saved</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{currency(totals.saved)}</CardContent>
        </Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader><CardTitle>Goals</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : goals.length === 0 ? (
            <div className="text-sm text-muted-foreground">No goals yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead className="text-right">Saved</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((g: any) => {
                  const t = Number(g.target_amount || 0);
                  const s = Number(g.saved_amount || 0);
                  const pct = t > 0 ? Math.min(100, Math.round((s / t) * 100)) : 0;

                  return (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.title}</TableCell>
                      <TableCell className="text-right">{currency(t)}</TableCell>
                      <TableCell className="text-right">{currency(s)}</TableCell>
                      <TableCell>
                        <div className="w-40">
                          <div className="h-2 w-full rounded bg-muted overflow-hidden">
                            <div className="h-2 bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{pct}%</div>
                        </div>
                      </TableCell>
                      <TableCell>{g.target_date ? new Date(g.target_date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        {g.type ? <Badge variant="secondary" className="capitalize">{g.type}</Badge> : "—"}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => setOpenAddFunds(g.id)}>
                          Add Funds
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Goal Modal */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Goal</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Target Amount *</Label>
              <Input
                type="number"
                min="0"
                value={form.target_amount}
                onChange={(e) => setForm((f) => ({ ...f, target_amount: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Target Date</Label>
                <Input
                  type="date"
                  value={form.target_date}
                  onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Input
                  placeholder="e.g., tax, general"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Goal</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Funds Modal */}
      <Dialog open={!!openAddFunds} onOpenChange={(v) => !v && setOpenAddFunds(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Funds</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount *</Label>
              <Input
                type="number"
                min="1"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAddFunds(null)}>
                Cancel
              </Button>
              <Button onClick={handleAddFunds}>Add</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
