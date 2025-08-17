-- Remove SECURITY DEFINER from v_dashboard_metrics view
DROP VIEW IF EXISTS v_dashboard_metrics;

-- Recreate as standard SECURITY INVOKER view (default)
CREATE VIEW v_dashboard_metrics AS
SELECT 
  COALESCE(SUM(CASE WHEN status = 'paid' AND DATE_TRUNC('month', paid_date) = DATE_TRUNC('month', CURRENT_DATE) THEN total_amount ELSE 0 END), 0) as this_month_paid,
  COALESCE(SUM(CASE WHEN status = 'overdue' THEN total_amount ELSE 0 END), 0) as overdue_amount,
  COALESCE(COUNT(CASE WHEN due_date <= CURRENT_DATE + INTERVAL '7 days' AND status = 'open' THEN 1 END), 0) as tasks_due_7d
FROM invoices
LEFT JOIN tasks ON true;