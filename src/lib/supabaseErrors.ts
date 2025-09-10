export function friendlyDeleteError(error: any, entity: "client" | "project" | "invoice") {
  const msg = error?.message?.toLowerCase() || "";
  if (msg.includes("foreign key") || msg.includes("violates foreign key")) {
    if (entity === "project") return "Cannot delete a project that has tasks. Reassign or delete tasks first.";
    if (entity === "client")  return "Cannot delete a client that has projects or invoices. Move or delete those first.";
    if (entity === "invoice") return "Cannot delete an invoice that has reminders/logs linked.";
  }
  return "";
}