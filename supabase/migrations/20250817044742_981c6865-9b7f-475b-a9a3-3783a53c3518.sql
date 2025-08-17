-- Remove SECURITY DEFINER from v_dashboard_metrics view
DROP VIEW IF EXISTS v_dashboard_metrics;

-- Recreate as standard SECURITY INVOKER view (default) with proper column references
CREATE VIEW v_dashboard_metrics AS
SELECT 
  COALESCE(SUM(CASE WHEN invoices.status = 'paid' AND DATE_TRUNC('month', invoices.paid_date) = DATE_TRUNC('month', CURRENT_DATE) THEN invoices.total_amount ELSE 0 END), 0) as this_month_paid,
  COALESCE(SUM(CASE WHEN invoices.status = 'overdue' THEN invoices.total_amount ELSE 0 END), 0) as overdue_amount,
  (SELECT COUNT(*) FROM tasks WHERE tasks.due_date <= CURRENT_DATE + INTERVAL '7 days' AND tasks.status = 'open') as tasks_due_7d
FROM invoices;