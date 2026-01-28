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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: []
      }
      digital_library: {
        Row: {
          category: string
          created_at: string
          description: string | null
          download_count: number
          file_url: string
          id: string
          is_active: boolean
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          download_count?: number
          file_url: string
          id?: string
          is_active?: boolean
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          download_count?: number
          file_url?: string
          id?: string
          is_active?: boolean
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      impact_metrics: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metric_name: string
          metric_value: number
          notes: string | null
          recorded_at: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metric_name: string
          metric_value?: number
          notes?: string | null
          recorded_at?: string
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metric_name?: string
          metric_value?: number
          notes?: string | null
          recorded_at?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string | null
          source: string | null
          subscribed_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
          source?: string | null
          subscribed_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          source?: string | null
          subscribed_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          admin_notes: string | null
          billing_address: Json | null
          created_at: string
          currency: string
          customer_email: string
          customer_location: string | null
          customer_name: string
          customer_phone: string | null
          delivered_at: string | null
          estimated_delivery_date: string | null
          id: string
          items: Json
          mpesa_checkout_id: string | null
          mpesa_transaction_id: string | null
          notes: string | null
          payment_intent_id: string | null
          payment_method: string | null
          payment_status: string
          shipped_at: string | null
          shipping_address: Json
          shipping_cost: number
          status: string
          stripe_session_id: string | null
          subtotal: number
          tax: number
          total: number
          total_amount: number | null
          tracking_carrier: string | null
          tracking_number: string | null
          updated_at: string
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          admin_notes?: string | null
          billing_address?: Json | null
          created_at?: string
          currency?: string
          customer_email: string
          customer_location?: string | null
          customer_name: string
          customer_phone?: string | null
          delivered_at?: string | null
          estimated_delivery_date?: string | null
          id?: string
          items?: Json
          mpesa_checkout_id?: string | null
          mpesa_transaction_id?: string | null
          notes?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_status?: string
          shipped_at?: string | null
          shipping_address?: Json
          shipping_cost?: number
          status?: string
          stripe_session_id?: string | null
          subtotal?: number
          tax?: number
          total?: number
          total_amount?: number | null
          tracking_carrier?: string | null
          tracking_number?: string | null
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          admin_notes?: string | null
          billing_address?: Json | null
          created_at?: string
          currency?: string
          customer_email?: string
          customer_location?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivered_at?: string | null
          estimated_delivery_date?: string | null
          id?: string
          items?: Json
          mpesa_checkout_id?: string | null
          mpesa_transaction_id?: string | null
          notes?: string | null
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_status?: string
          shipped_at?: string | null
          shipping_address?: Json
          shipping_cost?: number
          status?: string
          stripe_session_id?: string | null
          subtotal?: number
          tax?: number
          total?: number
          total_amount?: number | null
          tracking_carrier?: string | null
          tracking_number?: string | null
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          page_path: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          page_path: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          page_path?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_configurations: {
        Row: {
          connection_type: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_default: boolean
          is_test_mode: boolean
          metadata: Json | null
          name: string
          provider: string
          stripe_account_id: string | null
          stripe_publishable_key: string | null
          updated_at: string
        }
        Insert: {
          connection_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_test_mode?: boolean
          metadata?: Json | null
          name: string
          provider?: string
          stripe_account_id?: string | null
          stripe_publishable_key?: string | null
          updated_at?: string
        }
        Update: {
          connection_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_test_mode?: boolean
          metadata?: Json | null
          name?: string
          provider?: string
          stripe_account_id?: string | null
          stripe_publishable_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_performance_stats: {
        Row: {
          add_to_cart: number | null
          created_at: string
          date: string
          id: string
          product_id: string
          purchases: number | null
          revenue: number | null
          updated_at: string
          views: number | null
        }
        Insert: {
          add_to_cart?: number | null
          created_at?: string
          date?: string
          id?: string
          product_id: string
          purchases?: number | null
          revenue?: number | null
          updated_at?: string
          views?: number | null
        }
        Update: {
          add_to_cart?: number | null
          created_at?: string
          date?: string
          id?: string
          product_id?: string
          purchases?: number | null
          revenue?: number | null
          updated_at?: string
          views?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          carbon_offset_kg: number | null
          category: string
          created_at: string
          currency: string
          description: string | null
          featured: boolean
          id: string
          image_url: string | null
          images: string[] | null
          is_active: boolean
          metadata: Json | null
          name: string
          price: number
          sale_price: number | null
          sku: string | null
          source_location: string | null
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          carbon_offset_kg?: number | null
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean
          metadata?: Json | null
          name: string
          price?: number
          sale_price?: number | null
          sku?: string | null
          source_location?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          carbon_offset_kg?: number | null
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean
          metadata?: Json | null
          name?: string
          price?: number
          sale_price?: number | null
          sku?: string | null
          source_location?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          postal_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          is_active: boolean
          report_type: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          report_type?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          report_type?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_active: boolean
          page_name: string
          section_key: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          page_name: string
          section_key: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          page_name?: string
          section_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          responsibilities: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          responsibilities?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          responsibilities?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
