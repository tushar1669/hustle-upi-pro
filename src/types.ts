export type StatusInvoice = "draft" | "sent" | "overdue" | "paid";
export type StatusTask = "open" | "done";
export type Channel = "whatsapp" | "email";

export interface Settings {
  displayName: string;
  upiVpa: string;
  defaultGst: number;
  invoicePrefix: string;
}

export interface Client {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
  address: string;
  gstin?: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  isBillable: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  projectId?: string;
  issueDate: string; // ISO
  dueDate: string; // ISO
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  status: StatusInvoice;
  paidDate?: string; // ISO
  utr?: string;
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  title: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface Task {
  id: string;
  title: string;
  projectId?: string;
  dueDate?: string; // ISO
  isBillable: boolean;
  status: StatusTask;
  linkedInvoiceId?: string;
  notes?: string;
}

export interface Reminder {
  id: string;
  invoiceId: string;
  scheduledAt: string; // ISO
  channel: Channel;
  status: "pending" | "sent" | "skipped";
  suggestedTime?: string; // "20:30"
}

export interface MessageLogEntry {
  id: string;
  related: "invoice" | "task";
  relatedId: string;
  channel: Channel;
  sentAt: string; // ISO
  template: string;
  outcome: string;
}
