export function friendlyDeleteError(e: any, entity: 'client' | 'project' | 'invoice'): string | null {
  const code = e?.code || e?.status || '';
  const msg = (e?.message || '').toLowerCase();
  const isFK = code === '23503' || msg.includes('foreign key') || msg.includes('violates foreign key');
  
  if (!isFK) return null;

  if (entity === 'client') return 'Cannot delete: this client has related projects/invoices/reminders.';
  if (entity === 'project') return 'Cannot delete: this project still has tasks.';
  if (entity === 'invoice') return 'Cannot delete: this invoice has reminders or message history.';
  
  return null;
}