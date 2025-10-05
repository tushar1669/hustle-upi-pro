import { supabase } from "@/integrations/supabase/client";

export interface CreateInvoiceArgs {
  owner_id: string;
  invoice_prefix: string;
  client_id: string;
  project_id?: string | null;
  issue_date: string;  // 'YYYY-MM-DD'
  due_date: string;    // 'YYYY-MM-DD'
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  status: "draft" | "sent" | "paid";
  items: Array<{ title: string; qty: number; rate: number; amount: number }>;
}

export interface InvoiceResult {
  id: string;
  invoice_number: string;
  client_id: string;
  project_id: string | null;
  issue_date: string;
  due_date: string;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  status: "draft" | "sent" | "paid";
  created_at: string;
  owner_id: string;
}

/**
 * Create invoice with items using atomic server-side RPC.
 * Handles collision-safe invoice numbering under advisory lock.
 */
export async function rpcCreateInvoiceWithItems(args: CreateInvoiceArgs): Promise<InvoiceResult> {
  const { data, error } = await supabase.rpc("create_invoice_with_items", {
    p_invoice: {
      owner_id: args.owner_id,
      invoice_prefix: args.invoice_prefix,
      client_id: args.client_id,
      project_id: args.project_id ?? null,
      issue_date: args.issue_date,
      due_date: args.due_date,
      subtotal: args.subtotal,
      gst_amount: args.gst_amount,
      total_amount: args.total_amount,
      status: args.status
    },
    p_items: args.items
  });
  
  if (error) throw error;
  return data as unknown as InvoiceResult;
}
