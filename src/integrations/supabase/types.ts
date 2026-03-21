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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          message: string | null
          request_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          message?: string | null
          request_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          message?: string | null
          request_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      linked_banks: {
        Row: {
          created_at: string
          id: string
          status: string | null
          user_id: string
          vpa: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string | null
          user_id: string
          vpa: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string | null
          user_id?: string
          vpa?: string
        }
        Relationships: []
      }
      linked_cards: {
        Row: {
          card_last4: string
          card_token: string
          card_type: string | null
          created_at: string
          expiry_month: number
          expiry_year: number
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          card_last4: string
          card_token: string
          card_type?: string | null
          created_at?: string
          expiry_month: number
          expiry_year: number
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          card_last4?: string
          card_token?: string
          card_type?: string | null
          created_at?: string
          expiry_month?: number
          expiry_year?: number
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          mcc: string
          redeem_code: string | null
          reward_percent: number
          terms: string | null
          title: string
          valid_from: string
          valid_to: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          mcc: string
          redeem_code?: string | null
          reward_percent?: number
          terms?: string | null
          title: string
          valid_from?: string
          valid_to: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          mcc?: string
          redeem_code?: string | null
          reward_percent?: number
          terms?: string | null
          title?: string
          valid_from?: string
          valid_to?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          balance: number | null
          card_balance: number | null
          created_at: string
          ekyc_enrolled: boolean | null
          failed_mpin_attempts: number | null
          first_name: string | null
          id: string
          kyc_status: string | null
          last_failed_attempt: string | null
          last_name: string | null
          mpin_hash: string | null
          mpin_locked_until: string | null
          phone: string | null
          tier_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number | null
          card_balance?: number | null
          created_at?: string
          ekyc_enrolled?: boolean | null
          failed_mpin_attempts?: number | null
          first_name?: string | null
          id?: string
          kyc_status?: string | null
          last_failed_attempt?: string | null
          last_name?: string | null
          mpin_hash?: string | null
          mpin_locked_until?: string | null
          phone?: string | null
          tier_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number | null
          card_balance?: number | null
          created_at?: string
          ekyc_enrolled?: boolean | null
          failed_mpin_attempts?: number | null
          first_name?: string | null
          id?: string
          kyc_status?: string | null
          last_failed_attempt?: string | null
          last_name?: string | null
          mpin_hash?: string | null
          mpin_locked_until?: string | null
          phone?: string | null
          tier_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rewards_ledger: {
        Row: {
          cashback: number
          created_at: string
          id: string
          points: number
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          cashback?: number
          created_at?: string
          id?: string
          points?: number
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          cashback?: number
          created_at?: string
          id?: string
          points?: number
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_ledger_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          coupon_code: string | null
          created_at: string
          discount_amount: number | null
          id: string
          merchant: string
          original_amount: number | null
          rail: string
          recipient_id: string | null
          reward_amount: number | null
          status: string | null
          transaction_ref: string | null
          transaction_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          coupon_code?: string | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          merchant: string
          original_amount?: number | null
          rail: string
          recipient_id?: string | null
          reward_amount?: number | null
          status?: string | null
          transaction_ref?: string | null
          transaction_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          coupon_code?: string | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          merchant?: string
          original_amount?: number | null
          rail?: string
          recipient_id?: string | null
          reward_amount?: number | null
          status?: string | null
          transaction_ref?: string | null
          transaction_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      atomic_deduct_balance: {
        Args: { p_amount: number; p_user_id: string }
        Returns: boolean
      }
      atomic_deduct_card_balance: {
        Args: { p_amount: number; p_user_id: string }
        Returns: boolean
      }
      atomic_p2p_transfer: {
        Args: { p_amount: number; p_recipient_id: string; p_sender_id: string }
        Returns: boolean
      }
      get_user_display_name: {
        Args: { target_user_id: string }
        Returns: {
          first_name: string
          last_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
