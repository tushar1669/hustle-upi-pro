import { create } from "zustand";
import { addDays, differenceInCalendarDays, isAfter, isBefore, isSameMonth, isWithinInterval, parseISO } from "date-fns";
import type { Channel, Client, Invoice, InvoiceItem, MessageLogEntry, Project, Reminder, Settings, Task } from "@/types";

function uid(prefix = "id") { return `${prefix}_${Math.random().toString(36).slice(2,9)}` }

export interface AppState {
  settings: Settings;
  clients: Client[];
  projects: Project[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  tasks: Task[];
  reminders: Reminder[];
  messageLog: MessageLogEntry[];

  // Derived helpers
  thisMonthPaid: () => number;
  overdueAmount: () => number;
  tasksDue7d: () => number;

  // Actions
  addClient: (c: Omit<Client, "id">) => Client;
  addInvoiceDraft: (invoice: Omit<Invoice, "id"|"status"> & { status?: Invoice["status"] }, items: Omit<InvoiceItem, "id">[]) => Invoice;
  markInvoiceSent: (invoiceId: string) => void;
  markInvoicePaid: (invoiceId: string, paidDate: string, utr?: string) => void;
  addTask: (t: Omit<Task, "id"|"status"> & { status?: Task["status"] }) => Task;
  toggleTaskDone: (taskId: string) => void;
  logMessage: (entry: Omit<MessageLogEntry, "id"|"sentAt"> & { sentAt?: string }) => void;
  scheduleReminders: (invoiceId: string, startDateISO: string) => void;
}

const todayISO = new Date().toISOString();

const initial: Pick<AppState, "settings"|"clients"|"projects"|"invoices"|"invoiceItems"|"tasks"|"reminders"|"messageLog"> = {
  settings: { displayName: "HustleHub Demo", upiVpa: "tushar@upi", defaultGst: 18, invoicePrefix: "HH" },
  clients: [
    { id: "c1", name: "Tech Solutions Pvt Ltd", whatsapp: "+91 90000 11111", email: "billing@techsolutions.in", address: "Bangalore, India", gstin: "29ABCDE1234F1Z5" },
    { id: "c2", name: "Global Innovations Ltd", whatsapp: "+91 90000 22222", email: "accounts@global.io", address: "Mumbai, India", gstin: "27ABCDE1234F1Z5" },
    { id: "c3", name: "Creative Designs Studio", whatsapp: "+91 90000 33333", email: "hello@creatives.com", address: "Delhi, India" },
  ],
  projects: [
    { id: "p1", clientId: "c1", name: "Website Revamp", isBillable: true },
    { id: "p2", clientId: "c2", name: "Mobile App MVP", isBillable: true },
  ],
  invoices: [
    { id: "i1", invoiceNumber: "HH-2025-0001", clientId: "c1", projectId: "p1", issueDate: new Date().toISOString(), dueDate: addDays(new Date(), 7).toISOString(), subtotal: 15000, gstAmount: 2700, totalAmount: 17700, status: "sent" },
    { id: "i2", invoiceNumber: "HH-2025-0002", clientId: "c2", issueDate: addDays(new Date(), -40).toISOString(), dueDate: addDays(new Date(), -10).toISOString(), subtotal: 8200, gstAmount: 1476, totalAmount: 9676, status: "overdue" },
    { id: "i3", invoiceNumber: "HH-2025-0003", clientId: "c3", issueDate: addDays(new Date(), -25).toISOString(), dueDate: addDays(new Date(), -5).toISOString(), subtotal: 18000, gstAmount: 3240, totalAmount: 21240, status: "paid", paidDate: addDays(new Date(), -3).toISOString(), utr: "AXIS123456" },
  ],
  invoiceItems: [
    { id: uid("it"), invoiceId: "i1", title: "UI/UX Consultation", qty: 1, rate: 15000, amount: 15000 },
    { id: uid("it"), invoiceId: "i2", title: "Backend Integration", qty: 1, rate: 8200, amount: 8200 },
    { id: uid("it"), invoiceId: "i3", title: "Design Sprint", qty: 1, rate: 18000, amount: 18000 },
  ],
  tasks: [
    { id: "t1", title: "Design Homepage Layout", projectId: "p1", dueDate: addDays(new Date(), 2).toISOString(), isBillable: true, status: "open" },
    { id: "t2", title: "Prepare Q3 Financial Report", isBillable: false, dueDate: addDays(new Date(), 6).toISOString(), status: "open" },
    { id: "t3", title: "Client Onboarding Call - Beta Solutions", projectId: "p2", isBillable: true, dueDate: addDays(new Date(), -1).toISOString(), status: "open" },
    { id: "t4", title: "Develop Backend API for Invoicing", projectId: "p1", isBillable: true, dueDate: addDays(new Date(), 10).toISOString(), status: "open" },
  ],
  reminders: [],
  messageLog: [
    { id: uid("m"), related: "invoice", relatedId: "i3", channel: "email", sentAt: addDays(new Date(), -3).toISOString(), template: "Payment received", outcome: "Paid" },
    { id: uid("m"), related: "invoice", relatedId: "i2", channel: "whatsapp", sentAt: addDays(new Date(), -7).toISOString(), template: "Reminder sent", outcome: "Pending" },
  ],
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initial,

  thisMonthPaid: () => {
    const { invoices } = get();
    const now = new Date();
    return invoices
      .filter((i) => i.status === "paid" && i.paidDate && isSameMonth(parseISO(i.paidDate), now))
      .reduce((sum, i) => sum + i.totalAmount, 0);
  },

  overdueAmount: () => {
    const { invoices } = get();
    const today = new Date();
    return invoices
      .filter((i) => ["sent", "overdue"].includes(i.status) && isBefore(parseISO(i.dueDate), today))
      .reduce((sum, i) => sum + i.totalAmount, 0);
  },

  tasksDue7d: () => {
    const { tasks } = get();
    const today = new Date();
    const upper = addDays(today, 7);
    return tasks.filter((t) => t.status === "open" && t.dueDate && isWithinInterval(parseISO(t.dueDate), { start: today, end: upper })).length;
  },

  addClient: (c) => {
    const client: Client = { id: uid("c"), ...c };
    set((s) => ({ clients: [client, ...s.clients] }));
    return client;
  },

  addInvoiceDraft: (invoice, items) => {
    const id = uid("i");
    const inv: Invoice = { id, status: invoice.status ?? "draft", ...invoice } as Invoice;
    const withIds: InvoiceItem[] = items.map((it) => ({ id: uid("it"), ...it, invoiceId: id }));
    set((s) => ({ invoices: [inv, ...s.invoices], invoiceItems: [...s.invoiceItems, ...withIds] }));
    return inv;
  },

  markInvoiceSent: (invoiceId) => {
    set((s) => ({ invoices: s.invoices.map((i) => i.id === invoiceId ? { ...i, status: "sent" } : i) }));
  },

  markInvoicePaid: (invoiceId, paidDate, utr) => {
    set((s) => ({ invoices: s.invoices.map((i) => i.id === invoiceId ? { ...i, status: "paid", paidDate, utr } : i) }));
  },

  addTask: (t) => {
    const task: Task = { id: uid("t"), status: t.status ?? "open", ...t };
    set((s) => ({ tasks: [task, ...s.tasks] }));
    return task;
  },

  toggleTaskDone: (taskId) => set((s) => ({ tasks: s.tasks.map((t) => t.id === taskId ? { ...t, status: t.status === "open" ? "done" : "open" } : t) })),

  logMessage: (entry) => set((s) => ({ messageLog: [{ id: uid("m"), sentAt: entry.sentAt ?? new Date().toISOString(), ...entry }, ...s.messageLog] })),

  scheduleReminders: (invoiceId, startDateISO) => {
    const base = parseISO(startDateISO);
    const plan = [3,7,14];
    const reminders: Reminder[] = [
      ...plan.map((d) => ({ id: uid("r"), invoiceId, scheduledAt: addDays(base, d).toISOString(), channel: "whatsapp" as Channel, status: "pending" as const, suggestedTime: "20:30" })),
    ];
    // daily until due+30 handled visually; for prototype we seed 5 more
    for (let d = 15; d <= 20; d += 1) {
      reminders.push({ id: uid("r"), invoiceId, scheduledAt: addDays(base, d).toISOString(), channel: "email", status: "pending", suggestedTime: "20:30" });
    }
    set((s) => ({ reminders: [...s.reminders, ...reminders] }));
  },
}));

// Mark overdue on load
const { invoices } = useAppStore.getState();
const updated = invoices.map((i) => {
  const today = new Date();
  if (["sent", "overdue"].includes(i.status) && isBefore(parseISO(i.dueDate), today)) {
    return { ...i, status: "overdue" as const };
  }
  return i;
});
useAppStore.setState({ invoices: updated });
