// Centralized cache key management for React Query
export const CACHE_KEYS = {
  SETTINGS: ['settings_one'],
  CLIENTS: ['clients_all'], 
  PROJECTS: ['projects_all'],
  INVOICES: ['invoices_all'],
  TASKS: ['tasks_all'],
  REMINDERS: ['reminders'],
  DASHBOARD: ['v_dashboard_metrics'],
  MESSAGES: ['message_log_recent'],
  SAVINGS_GOALS: ['savings_goals_all'],
  INVOICE_ITEMS: (invoiceId: string) => ['invoice_items', invoiceId]
} as const;

// Helper function to invalidate related caches
export const invalidateTaskCaches = (queryClient: any) => {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.TASKS }),
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DASHBOARD }),
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.MESSAGES })
  ]);
};

export const invalidateInvoiceCaches = (queryClient: any) => {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.INVOICES }),
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DASHBOARD }),
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.MESSAGES })
  ]);
};

export const invalidateClientCaches = (queryClient: any) => {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.CLIENTS }),
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PROJECTS })
  ]);
};

export const invalidateAllCaches = (queryClient: any) => {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.SETTINGS }),
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.CLIENTS }),
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PROJECTS }),
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.INVOICES }),
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.TASKS }),
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DASHBOARD }),
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.MESSAGES })
  ]);
};