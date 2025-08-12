export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          gstin: string | null
          id: string
          name: string
          suggested_hour: string | null
          upi_vpa: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          suggested_hour?: string | null
          upi_vpa?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          suggested_hour?: string | null
          upi_vpa?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount: number
          id: string
          invoice_id: string
          qty: number
          rate: number
          title: string
        }
        Insert: {
          amount: number
          id?: string
          invoice_id: string
          qty?: number
          rate?: number
          title: string
        }
        Update: {
          amount?: number
          id?: string
          invoice_id?: string
          qty?: number
          rate?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string | null
          created_at: string | null
          due_date: string
          gst_amount: number
          id: string
          invoice_number: string
          issue_date: string | null
          paid_date: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total_amount: number
          upi_qr_svg: string | null
          utr_reference: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          due_date: string
          gst_amount?: number
          id?: string
          invoice_number: string
          issue_date?: string | null
          paid_date?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total_amount: number
          upi_qr_svg?: string | null
          utr_reference?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          due_date?: string
          gst_amount?: number
          id?: string
          invoice_number?: string
          issue_date?: string | null
          paid_date?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total_amount?: number
          upi_qr_svg?: string | null
          utr_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      message_log: {
        Row: {
          channel: Database["public"]["Enums"]["channel_type"] | null
          id: string
          outcome: string | null
          related_id: string
          related_type: string
          sent_at: string | null
          template_used: string | null
        }
        Insert: {
          channel?: Database["public"]["Enums"]["channel_type"] | null
          id?: string
          outcome?: string | null
          related_id: string
          related_type: string
          sent_at?: string | null
          template_used?: string | null
        }
        Update: {
          channel?: Database["public"]["Enums"]["channel_type"] | null
          id?: string
          outcome?: string | null
          related_id?: string
          related_type?: string
          sent_at?: string | null
          template_used?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          is_billable: boolean | null
          name: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_billable?: boolean | null
          name: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_billable?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          channel: Database["public"]["Enums"]["channel_type"]
          created_at: string | null
          id: string
          invoice_id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["reminder_status"]
        }
        Insert: {
          channel?: Database["public"]["Enums"]["channel_type"]
          created_at?: string | null
          id?: string
          invoice_id: string
          scheduled_at: string
          status?: Database["public"]["Enums"]["reminder_status"]
        }
        Update: {
          channel?: Database["public"]["Enums"]["channel_type"]
          created_at?: string | null
          id?: string
          invoice_id?: string
          scheduled_at?: string
          status?: Database["public"]["Enums"]["reminder_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string | null
          creator_display_name: string
          default_gst_percent: number
          id: number
          invoice_prefix: string
          upi_vpa: string
        }
        Insert: {
          created_at?: string | null
          creator_display_name?: string
          default_gst_percent?: number
          id?: never
          invoice_prefix?: string
          upi_vpa?: string
        }
        Update: {
          created_at?: string | null
          creator_display_name?: string
          default_gst_percent?: number
          id?: never
          invoice_prefix?: string
          upi_vpa?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string | null
          due_date: string | null
          id: string
          is_billable: boolean | null
          linked_invoice_id: string | null
          notes: string | null
          project_id: string | null
          reminder_time: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_billable?: boolean | null
          linked_invoice_id?: string | null
          notes?: string | null
          project_id?: string | null
          reminder_time?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_billable?: boolean | null
          linked_invoice_id?: string | null
          notes?: string | null
          project_id?: string | null
          reminder_time?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_linked_invoice_id_fkey"
            columns: ["linked_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_dashboard_metrics: {
        Row: {
          overdue_amount: number | null
          tasks_due_7d: number | null
          this_month_paid: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      channel_type: "whatsapp" | "email"
      invoice_status: "draft" | "sent" | "overdue" | "paid"
      reminder_status: "pending" | "sent" | "skipped"
      task_status: "open" | "done"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      channel_type: ["whatsapp", "email"],
      invoice_status: ["draft", "sent", "overdue", "paid"],
      reminder_status: ["pending", "sent", "skipped"],
      task_status: ["open", "done"],
    },
  },
} as const
