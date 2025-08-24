import { settings_one, clients_all, invoice_with_items, update_reminder, create_message_log } from "@/data/collections";

function currencyINR(n: number) {
  return `₹${Number(n||0).toLocaleString("en-IN")}`;
}

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

  // Compose message
  const daysOver =
    invoice.status === "paid"
      ? 0
      : Math.max(0, Math.ceil((Date.now() - new Date(invoice.due_date).getTime()) / 86400000));

  const dueStr =
    invoice.status === "paid"
      ? "This invoice is already marked as paid."
      : (daysOver > 0
         ? `${daysOver} days overdue`
         : `due on ${new Date(invoice.due_date).toLocaleDateString()}`);

  const upiLink = `upi://pay?pa=${encodeURIComponent(settings.upi_vpa)}&pn=${encodeURIComponent(settings.creator_display_name)}&am=${encodeURIComponent(invoice.total_amount)}&tn=${encodeURIComponent(`INV ${invoice.invoice_number}`)}`;

  const msg =
`Hi ${client.name},

Just a reminder for *Invoice ${invoice.invoice_number}* — ${currencyINR(invoice.total_amount)} (${dueStr}).

You can pay securely via UPI:
${upiLink}

Thank you!`;

  // Launch WhatsApp in a new tab
  const phone = String(client.whatsapp).replace(/\D/g, "");
  const wa = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
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