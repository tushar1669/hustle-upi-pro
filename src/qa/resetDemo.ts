// Reset Demo Data - Clean Slate for Testing

import { supabase } from "@/integrations/supabase/client";

export interface ResetSummary {
  ok: boolean;
  tablesCleared: string[];
  error?: string;
}

export async function resetDemo(): Promise<ResetSummary> {
  try {
    const tablesToClear = [
      'invoice_items',
      'invoices', 
      'reminders',
      'tasks',
      'projects',
      'clients',
      'message_log'
    ];
    
    const clearedTables: string[] = [];
    
    // Clear in dependency order to avoid foreign key constraints
    for (const table of tablesToClear) {
      if (table === 'message_log') {
        // Clear only QA-related message logs to preserve system logs
        const { error } = await supabase
          .from('message_log' as any)
          .delete()
          .or('template_used.eq.qa_seed,template_used.eq.qa_check,template_used.eq.qa_fix,related_type.eq.qa');
        
        if (error && !error.message.includes('No rows found')) {
          console.warn(`Warning clearing ${table}:`, error);
        } else {
          clearedTables.push(table);
        }
      } else {
        // For other tables, clear all rows
        const { error } = await supabase
          .from(table as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except impossible UUID
        
        if (error && !error.message.includes('No rows found')) {
          console.warn(`Warning clearing ${table}:`, error);
        } else {
          clearedTables.push(table);
        }
      }
    }
    
    return {
      ok: true,
      tablesCleared: clearedTables
    };
  } catch (error) {
    return {
      ok: false,
      tablesCleared: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}