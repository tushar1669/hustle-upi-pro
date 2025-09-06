import { settings_one, clients_all, invoice_with_items, update_reminder, create_message_log } from "@/data/collections";
import { buildInvoiceReminderText, buildInvoiceReminderEmail, buildWhatsAppUrl, buildMailtoUrl, sanitizePhoneForWhatsApp } from "@/services/payments";

export async function sendReminderViaWhatsApp(reminder: any) {
  // Load all required data
  const settings = await settings_one();
  const clients = await clients_all();
  const invoice = await invoice_with_items(reminder.invoice_id);

  const client = clients.find((c: any) => c.id === invoice.client_id);
  if (!client) throw new Error("Client not found for this invoice.");
  if (!client.whatsapp) throw new Error("Client is missing a WhatsApp number.");
  if (!settings?.upi_vpa || !settings?.creator_display_name) {
    throw new Error("Business UPI settings are missing (Settings → UPI & Branding).");
  }

  // Generate message using payment helpers
  const { message, upiIntent } = buildInvoiceReminderText({
    clientName: client.name,
    invoiceNumber: invoice.invoice_number,
    amountINR: invoice.total_amount,
    dueDateISO: invoice.due_date,
    status: invoice.status,
    upiVpa: settings.upi_vpa,
    businessName: settings.creator_display_name
  });

  // Launch WhatsApp in a new tab using payment helpers
  const wa = buildWhatsAppUrl({ 
    phone: sanitizePhoneForWhatsApp(client.whatsapp), 
    text: message 
  });
  window.open(wa, "_blank");

  // Update reminder + log
  await update_reminder(reminder.id, { status: "sent" });

  await create_message_log({
    related_type: "invoice" as any,
    related_id: invoice.id,
    channel: "whatsapp" as any,
    template_used: "reminder_sent",
    outcome: "sent"
  });

  return { ok: true };
}

export async function sendReminderViaEmail(reminder: any) {
  // Load all required data
  const settings = await settings_one();
  const clients = await clients_all();
  const invoice = await invoice_with_items(reminder.invoice_id);

  const client = clients.find((c: any) => c.id === invoice.client_id);
  if (!client) throw new Error("Client not found for this invoice.");
  if (!client.email) throw new Error("Client is missing an email address.");
  if (!settings?.upi_vpa || !settings?.creator_display_name) {
    throw new Error("Business UPI settings are missing (Settings → UPI & Branding).");
  }

  // Generate email content using payment helpers
  const { subject, body, upiIntent } = buildInvoiceReminderEmail({
    clientName: client.name,
    invoiceNumber: invoice.invoice_number,
    amountINR: invoice.total_amount,
    dueDateISO: invoice.due_date,
    upiVpa: settings.upi_vpa,
    businessName: settings.creator_display_name
  });

  // Launch mailto in the same tab
  const mailtoUrl = buildMailtoUrl({
    email: client.email,
    subject,
    body
  });
  window.location.href = mailtoUrl;

  // Update reminder + log
  await update_reminder(reminder.id, { status: "sent" });

  await create_message_log({
    related_type: "invoice" as any,
    related_id: invoice.id,
    channel: "email" as any,
    template_used: "reminder_sent",
    outcome: "sent"
  });

  return { ok: true };
}