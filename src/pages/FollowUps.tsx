import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/store/useAppStore";
import { addDays, isToday, parseISO } from "date-fns";

export default function FollowUps() {
  const reminders = useAppStore((s) => s.reminders);
  const invoices = useAppStore((s) => s.invoices);
  const clients = useAppStore((s) => s.clients);

  const findInv = (id: string) => invoices.find((i) => i.id === id);
  const findClient = (id: string) => clients.find((c) => c.id === (findInv(id)?.clientId || ""));

  const dueToday = reminders.filter((r) => isToday(parseISO(r.scheduledAt)) && r.status === "pending");
  const sentThisWeek = reminders.filter((r) => parseISO(r.scheduledAt) >= addDays(new Date(), -7) && r.status === "sent");

  return (
    <div className="space-y-6">
      <SEO title="HustleHub — Follow-ups" description="Automated reminder overview." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle>Reminders Due Today</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{dueToday.length}</CardContent></Card>
        <Card><CardHeader><CardTitle>Sent This Week</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{sentThisWeek.length}</CardContent></Card>
        <Card><CardHeader><CardTitle>Response Rate</CardTitle></CardHeader><CardContent className="text-3xl font-bold">78%</CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Automated Follow-ups Overview</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Next Reminder</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminders.slice(0,20).map((r) => {
                const inv = findInv(r.invoiceId);
                const cli = inv ? clients.find(c => c.id === inv.clientId) : undefined;
                return (
                  <TableRow key={r.id}>
                    <TableCell>{cli?.name ?? "-"}</TableCell>
                    <TableCell>{inv?.invoiceNumber ?? "-"}</TableCell>
                    <TableCell>{new Date(r.scheduledAt).toLocaleString()}</TableCell>
                    <TableCell>{r.channel}</TableCell>
                    <TableCell>{r.status}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
