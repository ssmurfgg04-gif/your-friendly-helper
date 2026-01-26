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
            payment_configurations: {
              Row: {
                id: string
                name: string
                provider: string
                is_test_mode: boolean
                is_default: boolean
                is_active: boolean
                stripe_account_id: string | null
                stripe_publishable_key: string | null
                stripe_connect_id: string | null
                connection_type: string
                metadata: Json
                created_by: string | null
                created_at: string
                updated_at: string
              }
              Insert: {
                id?: string
                name: string
                provider?: string
                is_test_mode?: boolean
                is_default?: boolean
                is_active?: boolean
                stripe_account_id?: string | null
                stripe_publishable_key?: string | null
                stripe_connect_id?: string | null
                connection_type?: string
                metadata?: Json
                created_by?: string | null
                created_at?: string
                updated_at?: string
              }
              Update: {
                id?: string
                name?: string
                provider?: string
                is_test_mode?: boolean
                is_default?: boolean
                is_active?: boolean
                stripe_account_id?: string | null
                stripe_publishable_key?: string | null
                stripe_connect_id?: string | null
                connection_type?: string
                metadata?: Json
                created_by?: string | null
                created_at?: string
                updated_at?: string
              }
              Relationships: []
            }
            page_visits: {
            Row: {
              id: string
              page_path: string
              visitor_id: string | null
              session_id: string | null
              referrer: string | null
              user_agent: string | null
              device_type: string | null
              country: string | null
              city: string | null
              created_at: string
            }
            Insert: {
              id?: string
              page_path: string
              visitor_id?: string | null
              session_id?: string | null
              referrer?: string | null
              user_agent?: string | null
              device_type?: string | null
              country?: string | null
              city?: string | null
              created_at?: string
            }
            Update: {
              id?: string
              page_path?: string
              visitor_id?: string | null
              session_id?: string | null
              referrer?: string | null
              user_agent?: string | null
              device_type?: string | null
              country?: string | null
              city?: string | null
              created_at?: string
            }
            Relationships: []
          }
          digital_library: {
          Row: {
            category: string | null
            created_at: string
            description: string | null
            file_url: string | null
            id: string
            is_active: boolean
            thumbnail_url: string | null
            title: string
            updated_at: string
          }
          Insert: {
            category?: string | null
            created_at?: string
            description?: string | null
            file_url?: string | null
            id?: string
            is_active?: boolean
            thumbnail_url?: string | null
            title: string
            updated_at?: string
          }
          Update: {
            category?: string | null
            created_at?: string
            description?: string | null
            file_url?: string | null
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
          id: string
          metric_name: string
          metric_value: number
          notes: string | null
          recorded_at: string
          unit: string
        }
        Insert: {
          id?: string
          metric_name: string
          metric_value: number
          notes?: string | null
          recorded_at?: string
          unit: string
        }
        Update: {
          id?: string
          metric_name?: string
          metric_value?: number
          notes?: string | null
          recorded_at?: string
          unit?: string
        }
        Relationships: []
      }
orders: {
          Row: {
            created_at: string
            currency: string
            customer_location: string | null
            estimated_delivery_date: string | null
            id: string
            items: Json
            location_metadata: Json | null
            mpesa_transaction_id: string | null
            payment_method: string
            shipping_address: Json | null
            status: string
            stripe_session_id: string | null
            total_amount: number
            updated_at: string
            user_email: string
            user_name: string | null
          }
          Insert: {
            created_at?: string
            currency?: string
            customer_location?: string | null
            estimated_delivery_date?: string | null
            id?: string
            items: Json
            location_metadata?: Json | null
            mpesa_transaction_id?: string | null
            payment_method?: string
            shipping_address?: Json | null
            status?: string
            stripe_session_id?: string | null
            total_amount: number
            updated_at?: string
            user_email: string
            user_name?: string | null
          }
          Update: {
            created_at?: string
            currency?: string
            customer_location?: string | null
            estimated_delivery_date?: string | null
            id?: string
            items?: Json
            location_metadata?: Json | null
            mpesa_transaction_id?: string | null
            payment_method?: string
            shipping_address?: Json | null
            status?: string
            stripe_session_id?: string | null
            total_amount?: number
            updated_at?: string
            user_email?: string
            user_name?: string | null
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
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          source_location: string | null
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          carbon_offset_kg?: number | null
          category: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price: number
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
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
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
            report_type?: string | null
            status?: string | null
            title?: string
            updated_at?: string
          }
          Relationships: []
        }

        user_roles: {
          Row: {
            created_at: string
            id: string
            role: Database["public"]["Enums"]["app_role"]
            user_id: string
            responsibilities: string | null
          }
          Insert: {
            created_at?: string
            id?: string
            role?: Database["public"]["Enums"]["app_role"]
            user_id: string
            responsibilities?: string | null
          }
          Update: {
            created_at?: string
            id?: string
            role?: Database["public"]["Enums"]["app_role"]
            user_id?: string
            responsibilities?: string | null
          }
          Relationships: []
        }
        admin_messages: {
          Row: {
            id: string
            sender_id: string
            content: string
            created_at: string
          }
          Insert: {
            id?: string
            sender_id: string
            content: string
            created_at?: string
          }
          Update: {
            id?: string
            sender_id?: string
            content?: string
            created_at?: string
          }
          Relationships: [
            {
              foreignKeyName: "admin_messages_sender_id_fkey"
              columns: ["sender_id"]
              isOneToOne: false
              referencedRelation: "users"
              referencedColumns: ["id"]
            }
          ]
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
          Relationships: [
            {
              foreignKeyName: "wishlists_product_id_fkey"
              columns: ["product_id"]
              isOneToOne: false
              referencedRelation: "products"
              referencedColumns: ["id"]
            },
          ]
        }
        site_content: {
          Row: {
            id: string
            page_name: string
            section_key: string
            content: Json
            is_active: boolean
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            page_name: string
            section_key: string
            content?: Json
            is_active?: boolean
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            page_name?: string
            section_key?: string
            content?: Json
            is_active?: boolean
            created_at?: string
            updated_at?: string
          }
          Relationships: []
        }
product_events: {
            Row: {
              id: string
              product_id: string
              product_name: string
              event_type: string
              visitor_id: string | null
              session_id: string | null
              created_at: string
            }
            Insert: {
              id?: string
              product_id: string
              product_name: string
              event_type: string
              visitor_id?: string | null
              session_id?: string | null
              created_at?: string
            }
            Update: {
              id?: string
              product_id?: string
              product_name?: string
              event_type?: string
              visitor_id?: string | null
              session_id?: string | null
              created_at?: string
            }
            Relationships: [
              {
                foreignKeyName: "product_events_product_id_fkey"
                columns: ["product_id"]
                isOneToOne: false
                referencedRelation: "products"
                referencedColumns: ["id"]
              },
            ]
          }
          newsletter_subscribers: {
            Row: {
              id: string
              email: string
              name: string | null
              subscribed_at: string
              source: string
              is_active: boolean
              unsubscribed_at: string | null
            }
            Insert: {
              id?: string
              email: string
              name?: string | null
              subscribed_at?: string
              source?: string
              is_active?: boolean
              unsubscribed_at?: string | null
            }
            Update: {
              id?: string
              email?: string
              name?: string | null
              subscribed_at?: string
              source?: string
              is_active?: boolean
              unsubscribed_at?: string | null
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
        app_role: "admin" | "user" | "super_admin" | "editor" | "moderator" | "support"
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
        app_role: ["admin", "user", "super_admin", "editor", "moderator", "support"],
      },
    },
  } as const
  