export function friendlyDeleteError(error: any, entity: "client" | "project" | "invoice") {
  const msg = error?.message?.toLowerCase() || "";
  if (msg.includes("foreign key") || msg.includes("violates foreign key")) {
    if (entity === "project") return "Cannot delete a project that has tasks. Reassign or delete tasks first.";
    if (entity === "client")  return "Cannot delete a client with existing projects or invoices. Please reassign or delete them first.";
    if (entity === "invoice") return "Cannot delete an invoice with related reminders or logs. Please remove them first.";
  }
  return "";
}