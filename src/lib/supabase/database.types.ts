export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          created_at: string
          delivered_at: string | null
          delivery_date: string | null
          id: string
          locked: boolean
          notes: string | null
          quantity: number | null
          scheduled_for: string
          slot_id: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          subscription_id: string
          updated_at: string
          user_id: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          delivery_date?: string | null
          id?: string
          locked?: boolean
          notes?: string | null
          quantity?: number | null
          scheduled_for: string
          slot_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          subscription_id: string
          updated_at?: string
          user_id: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          delivery_date?: string | null
          id?: string
          locked?: boolean
          notes?: string | null
          quantity?: number | null
          scheduled_for?: string
          slot_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          subscription_id?: string
          updated_at?: string
          user_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "delivery_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_blackout_dates: {
        Row: {
          created_at: string
          date: string
          id: string
          reason: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          reason?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          reason?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_blackout_dates_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_slots: {
        Row: {
          active: boolean
          created_at: string
          end_time: string
          id: string
          name: string
          sort_order: number
          start_time: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_time: string
          id?: string
          name: string
          sort_order?: number
          start_time: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          end_time?: string
          id?: string
          name?: string
          sort_order?: number
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_zone_days: {
        Row: {
          active: boolean
          created_at: string
          id: string
          weekday: number
          zone_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          weekday: number
          zone_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          weekday?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zone_days_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          active: boolean
          comuna: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          comuna?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          comuna?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          mercadopago_payment_id: string
          paid_at: string | null
          raw: Json
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency: string
          id?: string
          mercadopago_payment_id: string
          paid_at?: string | null
          raw: Json
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          mercadopago_payment_id?: string
          paid_at?: string | null
          raw?: Json
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          description: string | null
          frequency: Database["public"]["Enums"]["plan_frequency"]
          id: string
          mercadopago_plan_id: string | null
          name: string
          price_cents: number
          product_id: string
          quantity_per_delivery: number
          slug: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          frequency: Database["public"]["Enums"]["plan_frequency"]
          id?: string
          mercadopago_plan_id?: string | null
          name: string
          price_cents: number
          product_id: string
          quantity_per_delivery: number
          slug?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          frequency?: Database["public"]["Enums"]["plan_frequency"]
          id?: string
          mercadopago_plan_id?: string | null
          name?: string
          price_cents?: number
          product_id?: string
          quantity_per_delivery?: number
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          sku: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          sku: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          sku?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string
          delivery_notes: string | null
          delivery_zone_id: string | null
          email: string | null
          full_name: string | null
          id: string
          mercadopago_customer_id: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          delivery_notes?: string | null
          delivery_zone_id?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          mercadopago_customer_id?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          delivery_notes?: string | null
          delivery_zone_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          mercadopago_customer_id?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      slot_capacity: {
        Row: {
          created_at: string
          id: string
          max_orders: number
          slot_id: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_orders: number
          slot_id: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_orders?: number
          slot_id?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slot_capacity_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "delivery_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_capacity_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          delivery_zone_id: string | null
          id: string
          mercadopago_subscription_id: string | null
          next_billing_at: string | null
          plan_id: string
          preferred_slot_id: string | null
          preferred_weekday: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          delivery_zone_id?: string | null
          id?: string
          mercadopago_subscription_id?: string | null
          next_billing_at?: string | null
          plan_id: string
          preferred_slot_id?: string | null
          preferred_weekday?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          delivery_zone_id?: string | null
          id?: string
          mercadopago_subscription_id?: string | null
          next_billing_at?: string | null
          plan_id?: string
          preferred_slot_id?: string | null
          preferred_weekday?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "admin_subscriptions_by_plan"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_preferred_slot_id_fkey"
            columns: ["preferred_slot_id"]
            isOneToOne: false
            referencedRelation: "delivery_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_deliveries_by_day: {
        Row: {
          delivered: number | null
          delivery_date: string | null
          failed_or_skipped: number | null
          out_for_delivery: number | null
          scheduled: number | null
          total_deliveries: number | null
          total_units: number | null
        }
        Relationships: []
      }
      admin_deliveries_upcoming: {
        Row: {
          id: string | null
          notes: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["delivery_status"] | null
          subscription_id: string | null
          user_email: string | null
          user_full_name: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_egg_demand_by_week: {
        Row: {
          delivery_count: number | null
          total_units: number | null
          week_start: string | null
        }
        Relationships: []
      }
      admin_metrics_overview: {
        Row: {
          active_subscriptions_count: number | null
          deliveries_completed_last_30d: number | null
          deliveries_scheduled_next_7d: number | null
          failed_deliveries_last_30d: number | null
          mrr_cents: number | null
          revenue_last_30d_cents: number | null
          revenue_mtd_cents: number | null
        }
        Relationships: []
      }
      admin_new_subscriptions_by_day: {
        Row: {
          count: number | null
          day: string | null
        }
        Relationships: []
      }
      admin_revenue_by_day: {
        Row: {
          day: string | null
          payment_count: number | null
          revenue_cents: number | null
        }
        Relationships: []
      }
      admin_slot_utilization: {
        Row: {
          booked: number | null
          delivery_date: string | null
          max_orders: number | null
          remaining: number | null
          slot_id: string | null
          slot_name: string | null
          zone_id: string | null
          zone_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "delivery_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_subscriptions_by_plan: {
        Row: {
          active: number | null
          plan_id: string | null
          plan_name: string | null
          total: number | null
        }
        Relationships: []
      }
      admin_subscriptions_by_status: {
        Row: {
          count: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_upcoming_deliveries: { Args: never; Returns: Json }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "customer"
      delivery_status:
        | "scheduled"
        | "out_for_delivery"
        | "delivered"
        | "failed"
        | "skipped"
      payment_status:
        | "pending"
        | "approved"
        | "rejected"
        | "refunded"
        | "charged_back"
      plan_frequency: "weekly" | "biweekly" | "monthly"
      subscription_status:
        | "pending"
        | "authorized"
        | "paused"
        | "cancelled"
        | "past_due"
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
      app_role: ["admin", "customer"],
      delivery_status: [
        "scheduled",
        "out_for_delivery",
        "delivered",
        "failed",
        "skipped",
      ],
      payment_status: [
        "pending",
        "approved",
        "rejected",
        "refunded",
        "charged_back",
      ],
      plan_frequency: ["weekly", "biweekly", "monthly"],
      subscription_status: [
        "pending",
        "authorized",
        "paused",
        "cancelled",
        "past_due",
      ],
    },
  },
} as const
