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
      agent_conversations: {
        Row: {
          channel: string
          created_at: string
          external_id: string
          id: string
          last_inbound_at: string | null
          last_outbound_at: string | null
          metadata: Json
          order_id: string | null
          status: Database["public"]["Enums"]["agent_conversation_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          external_id: string
          id?: string
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          metadata?: Json
          order_id?: string | null
          status?: Database["public"]["Enums"]["agent_conversation_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          external_id?: string
          id?: string
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          metadata?: Json
          order_id?: string | null
          status?: Database["public"]["Enums"]["agent_conversation_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_conversations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_message_feedback: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          message_id: string
          rating: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          message_id: string
          rating: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          message_id?: string
          rating?: string
        }
        Relationships: []
      }
      agent_messages: {
        Row: {
          completion_tokens: number | null
          content_text: string | null
          conversation_id: string
          created_at: string
          id: string
          parts: Json
          prompt_tokens: number | null
          provider_message_id: string | null
          role: string
          total_tokens: number | null
        }
        Insert: {
          completion_tokens?: number | null
          content_text?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          parts?: Json
          prompt_tokens?: number | null
          provider_message_id?: string | null
          role: string
          total_tokens?: number | null
        }
        Update: {
          completion_tokens?: number | null
          content_text?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          parts?: Json
          prompt_tokens?: number | null
          provider_message_id?: string | null
          role?: string
          total_tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_pending_approvals: {
        Row: {
          approval_id: string
          conversation_id: string
          created_at: string
          id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["approval_status"]
          summary: string | null
          tool_input: Json
          tool_name: string
        }
        Insert: {
          approval_id: string
          conversation_id: string
          created_at?: string
          id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          summary?: string | null
          tool_input?: Json
          tool_name: string
        }
        Update: {
          approval_id?: string
          conversation_id?: string
          created_at?: string
          id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          summary?: string | null
          tool_input?: Json
          tool_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_pending_approvals_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_config_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          limits: string
          model: string
          note: string | null
          order_rules: string
          persona: string
          sop_policies: string
          temperature: number
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          limits?: string
          model?: string
          note?: string | null
          order_rules?: string
          persona?: string
          sop_policies?: string
          temperature?: number
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          limits?: string
          model?: string
          note?: string | null
          order_rules?: string
          persona?: string
          sop_policies?: string
          temperature?: number
          version?: number
        }
        Relationships: []
      }
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
      coupon_redemptions: {
        Row: {
          amount_cents: number | null
          coupon_id: string
          id: string
          order_id: string | null
          redeemed_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents?: number | null
          coupon_id: string
          id?: string
          order_id?: string | null
          redeemed_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number | null
          coupon_id?: string
          id?: string
          order_id?: string | null
          redeemed_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          currency: string
          id: string
          incident_id: string | null
          max_redemptions: number
          reason: string | null
          redeemed_count: number
          status: Database["public"]["Enums"]["coupon_status"]
          type: Database["public"]["Enums"]["coupon_type"]
          user_id: string | null
          valid_from: string
          valid_until: string | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          id?: string
          incident_id?: string | null
          max_redemptions?: number
          reason?: string | null
          redeemed_count?: number
          status?: Database["public"]["Enums"]["coupon_status"]
          type: Database["public"]["Enums"]["coupon_type"]
          user_id?: string | null
          valid_from?: string
          valid_until?: string | null
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          id?: string
          incident_id?: string | null
          max_redemptions?: number
          reason?: string | null
          redeemed_count?: number
          status?: Database["public"]["Enums"]["coupon_status"]
          type?: Database["public"]["Enums"]["coupon_type"]
          user_id?: string | null
          valid_from?: string
          valid_until?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          created_at: string
          delivered_at: string | null
          delivery_date: string | null
          id: string
          locked: boolean
          lot_id: string | null
          notes: string | null
          out_for_delivery_at: string | null
          prepared_at: string | null
          quantity: number | null
          ready_at: string | null
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
          lot_id?: string | null
          notes?: string | null
          out_for_delivery_at?: string | null
          prepared_at?: string | null
          quantity?: number | null
          ready_at?: string | null
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
          lot_id?: string | null
          notes?: string | null
          out_for_delivery_at?: string | null
          prepared_at?: string | null
          quantity?: number | null
          ready_at?: string | null
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
            foreignKeyName: "deliveries_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "production_lots"
            referencedColumns: ["id"]
          },
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
      egg_ledger: {
        Row: {
          created_at: string
          delivery_id: string | null
          delta: number
          id: string
          note: string | null
          order_id: string | null
          payment_id: string | null
          reason: Database["public"]["Enums"]["egg_ledger_reason"]
          subscription_id: string | null
          user_id: string
          value_cents_per_unit: number | null
        }
        Insert: {
          created_at?: string
          delivery_id?: string | null
          delta: number
          id?: string
          note?: string | null
          order_id?: string | null
          payment_id?: string | null
          reason: Database["public"]["Enums"]["egg_ledger_reason"]
          subscription_id?: string | null
          user_id: string
          value_cents_per_unit?: number | null
        }
        Update: {
          created_at?: string
          delivery_id?: string | null
          delta?: number
          id?: string
          note?: string | null
          order_id?: string | null
          payment_id?: string | null
          reason?: Database["public"]["Enums"]["egg_ledger_reason"]
          subscription_id?: string | null
          user_id?: string
          value_cents_per_unit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "egg_ledger_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "admin_deliveries_upcoming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "egg_ledger_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "egg_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "egg_ledger_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "egg_ledger_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "egg_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_photos: {
        Row: {
          created_at: string
          id: string
          incident_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          incident_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          incident_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_photos_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          created_at: string
          delivery_id: string | null
          description: string | null
          id: string
          note: string | null
          order_id: string | null
          reported_at: string
          resolution: Database["public"]["Enums"]["incident_resolution"] | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["incident_status"]
          type: Database["public"]["Enums"]["incident_type"]
          updated_at: string
          user_id: string
          within_window: boolean | null
        }
        Insert: {
          created_at?: string
          delivery_id?: string | null
          description?: string | null
          id?: string
          note?: string | null
          order_id?: string | null
          reported_at?: string
          resolution?: Database["public"]["Enums"]["incident_resolution"] | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          type?: Database["public"]["Enums"]["incident_type"]
          updated_at?: string
          user_id: string
          within_window?: boolean | null
        }
        Update: {
          created_at?: string
          delivery_id?: string | null
          description?: string | null
          id?: string
          note?: string | null
          order_id?: string | null
          reported_at?: string
          resolution?: Database["public"]["Enums"]["incident_resolution"] | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          type?: Database["public"]["Enums"]["incident_type"]
          updated_at?: string
          user_id?: string
          within_window?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "admin_deliveries_upcoming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          channel: string
          created_at: string
          delivery_id: string | null
          event_type: Database["public"]["Enums"]["notification_event_type"]
          id: string
          order_id: string | null
          payload: Json
          scheduled_for: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          user_id: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          delivery_id?: string | null
          event_type: Database["public"]["Enums"]["notification_event_type"]
          id?: string
          order_id?: string | null
          payload?: Json
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          user_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          delivery_id?: string | null
          event_type?: Database["public"]["Enums"]["notification_event_type"]
          id?: string
          order_id?: string | null
          payload?: Json
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "admin_deliveries_upcoming"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_cents: number
          contact_name: string | null
          contact_phone: string
          conversation_id: string | null
          created_at: string
          currency: string
          delivery_address: string | null
          delivery_notes: string | null
          delivery_zone_id: string | null
          id: string
          mercadopago_payment_id: string | null
          payment_expires_at: string | null
          plan_id: string | null
          preferred_slot_id: string | null
          quantity: number
          requested_delivery_date: string | null
          source: string
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          contact_name?: string | null
          contact_phone: string
          conversation_id?: string | null
          created_at?: string
          currency?: string
          delivery_address?: string | null
          delivery_notes?: string | null
          delivery_zone_id?: string | null
          id?: string
          mercadopago_payment_id?: string | null
          payment_expires_at?: string | null
          plan_id?: string | null
          preferred_slot_id?: string | null
          quantity: number
          requested_delivery_date?: string | null
          source?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          contact_name?: string | null
          contact_phone?: string
          conversation_id?: string | null
          created_at?: string
          currency?: string
          delivery_address?: string | null
          delivery_notes?: string | null
          delivery_zone_id?: string | null
          id?: string
          mercadopago_payment_id?: string | null
          payment_expires_at?: string | null
          plan_id?: string | null
          preferred_slot_id?: string | null
          quantity?: number
          requested_delivery_date?: string | null
          source?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "admin_subscriptions_by_plan"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_preferred_slot_id_fkey"
            columns: ["preferred_slot_id"]
            isOneToOne: false
            referencedRelation: "delivery_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          expires_at: string | null
          external_reference: string
          id: string
          mercadopago_payment_id: string | null
          mp_init_point: string | null
          mp_preference_id: string | null
          order_id: string | null
          paid_at: string | null
          raw: Json | null
          source: string
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency: string
          expires_at?: string | null
          external_reference?: string
          id?: string
          mercadopago_payment_id?: string | null
          mp_init_point?: string | null
          mp_preference_id?: string | null
          order_id?: string | null
          paid_at?: string | null
          raw?: Json | null
          source?: string
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          external_reference?: string
          id?: string
          mercadopago_payment_id?: string | null
          mp_init_point?: string | null
          mp_preference_id?: string | null
          order_id?: string | null
          paid_at?: string | null
          raw?: Json | null
          source?: string
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
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
      points_ledger: {
        Row: {
          created_at: string
          delta: number
          id: string
          note: string | null
          order_id: string | null
          payment_id: string | null
          reason: Database["public"]["Enums"]["points_ledger_reason"]
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          note?: string | null
          order_id?: string | null
          payment_id?: string | null
          reason: Database["public"]["Enums"]["points_ledger_reason"]
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          note?: string | null
          order_id?: string | null
          payment_id?: string | null
          reason?: Database["public"]["Enums"]["points_ledger_reason"]
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_ledger_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_ledger_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_webhook_events: {
        Row: {
          event_id: string
          id: string
          processed_at: string
          provider: string
        }
        Insert: {
          event_id: string
          id?: string
          processed_at?: string
          provider: string
        }
        Update: {
          event_id?: string
          id?: string
          processed_at?: string
          provider?: string
        }
        Relationships: []
      }
      production_lots: {
        Row: {
          classification_date: string | null
          created_at: string
          dispatch_date: string | null
          id: string
          lot_code: string
          notes: string | null
          postura_date: string | null
          prepared_date: string | null
          product_id: string | null
          trace_token: string
          updated_at: string
        }
        Insert: {
          classification_date?: string | null
          created_at?: string
          dispatch_date?: string | null
          id?: string
          lot_code: string
          notes?: string | null
          postura_date?: string | null
          prepared_date?: string | null
          product_id?: string | null
          trace_token?: string
          updated_at?: string
        }
        Update: {
          classification_date?: string | null
          created_at?: string
          dispatch_date?: string | null
          id?: string
          lot_code?: string
          notes?: string | null
          postura_date?: string | null
          prepared_date?: string | null
          product_id?: string | null
          trace_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_lots_product_id_fkey"
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
          points_balance: number
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
          points_balance?: number
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
          points_balance?: number
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
          contact_email: string | null
          contact_phone: string | null
          conversation_id: string | null
          created_at: string
          delivery_zone_id: string | null
          egg_balance: number
          external_reference: string
          id: string
          mercadopago_subscription_id: string | null
          next_billing_at: string | null
          pause_reason: string | null
          paused_at: string | null
          plan_id: string
          preferred_slot_id: string | null
          preferred_weekday: number | null
          reactivated_at: string | null
          resume_at: string | null
          source: string
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          conversation_id?: string | null
          created_at?: string
          delivery_zone_id?: string | null
          egg_balance?: number
          external_reference?: string
          id?: string
          mercadopago_subscription_id?: string | null
          next_billing_at?: string | null
          pause_reason?: string | null
          paused_at?: string | null
          plan_id: string
          preferred_slot_id?: string | null
          preferred_weekday?: number | null
          reactivated_at?: string | null
          resume_at?: string | null
          source?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          conversation_id?: string | null
          created_at?: string
          delivery_zone_id?: string | null
          egg_balance?: number
          external_reference?: string
          id?: string
          mercadopago_subscription_id?: string | null
          next_billing_at?: string | null
          pause_reason?: string | null
          paused_at?: string | null
          plan_id?: string
          preferred_slot_id?: string | null
          preferred_weekday?: number | null
          reactivated_at?: string | null
          resume_at?: string | null
          source?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
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
      activate_agent_config_version: {
        Args: { p_id: string }
        Returns: Database["public"]["Tables"]["agent_config_versions"]["Row"]
      }
      delivery_customer_state: {
        Args: { p_delivery_id: string }
        Returns: string
      }
      save_agent_config: {
        Args: {
          p_persona: string
          p_order_rules: string
          p_sop_policies: string
          p_limits: string
          p_model: string
          p_temperature: number
          p_note?: string
        }
        Returns: Database["public"]["Tables"]["agent_config_versions"]["Row"]
      }
      generate_upcoming_deliveries: { Args: never; Returns: Json }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      process_subscription_pauses: { Args: never; Returns: Json }
    }
    Enums: {
      agent_conversation_status: "open" | "awaiting_approval" | "closed"
      app_role: "admin" | "customer"
      approval_status: "pending" | "approved" | "denied" | "expired"
      coupon_status: "active" | "redeemed" | "expired" | "void"
      coupon_type: "percent" | "fixed" | "eggs"
      delivery_status:
        | "scheduled"
        | "preparing"
        | "ready_for_dispatch"
        | "out_for_delivery"
        | "delivered"
        | "failed"
        | "skipped"
      egg_ledger_reason:
        | "plan_credit"
        | "delivery_debit"
        | "refund"
        | "adjustment"
        | "incident_credit"
      incident_resolution:
        | "partial_replacement"
        | "full_replacement"
        | "coupon"
        | "none"
      incident_status: "open" | "reviewing" | "resolved" | "rejected"
      incident_type:
        | "damaged_product"
        | "missing_items"
        | "wrong_items"
        | "other"
      notification_event_type:
        | "payment_confirmed"
        | "preparing"
        | "out_for_delivery"
        | "eta_20m"
        | "eta_5m"
        | "delivered"
      notification_status: "pending" | "sent" | "failed" | "skipped"
      order_status:
        | "pending"
        | "awaiting_payment"
        | "paid"
        | "fulfilling"
        | "completed"
        | "cancelled"
        | "refunded"
      payment_status:
        | "pending"
        | "approved"
        | "rejected"
        | "refunded"
        | "charged_back"
        | "cancelled"
        | "expired"
      plan_frequency: "weekly" | "biweekly" | "monthly"
      points_ledger_reason:
        | "purchase"
        | "renewal"
        | "redemption"
        | "expiration"
        | "adjustment"
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
      agent_conversation_status: ["open", "awaiting_approval", "closed"],
      app_role: ["admin", "customer"],
      approval_status: ["pending", "approved", "denied", "expired"],
      coupon_status: ["active", "redeemed", "expired", "void"],
      coupon_type: ["percent", "fixed", "eggs"],
      delivery_status: [
        "scheduled",
        "preparing",
        "ready_for_dispatch",
        "out_for_delivery",
        "delivered",
        "failed",
        "skipped",
      ],
      egg_ledger_reason: [
        "plan_credit",
        "delivery_debit",
        "refund",
        "adjustment",
        "incident_credit",
      ],
      incident_resolution: [
        "partial_replacement",
        "full_replacement",
        "coupon",
        "none",
      ],
      incident_status: ["open", "reviewing", "resolved", "rejected"],
      incident_type: [
        "damaged_product",
        "missing_items",
        "wrong_items",
        "other",
      ],
      notification_event_type: [
        "payment_confirmed",
        "preparing",
        "out_for_delivery",
        "eta_20m",
        "eta_5m",
        "delivered",
      ],
      notification_status: ["pending", "sent", "failed", "skipped"],
      order_status: [
        "pending",
        "awaiting_payment",
        "paid",
        "fulfilling",
        "completed",
        "cancelled",
        "refunded",
      ],
      payment_status: [
        "pending",
        "approved",
        "rejected",
        "refunded",
        "charged_back",
        "cancelled",
        "expired",
      ],
      plan_frequency: ["weekly", "biweekly", "monthly"],
      points_ledger_reason: [
        "purchase",
        "renewal",
        "redemption",
        "expiration",
        "adjustment",
      ],
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
