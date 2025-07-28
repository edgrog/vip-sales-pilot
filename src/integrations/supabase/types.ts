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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ad_tags: {
        Row: {
          ad_id: string
          chain: string | null
          notes: string | null
          state: string | null
          tag: string | null
        }
        Insert: {
          ad_id: string
          chain?: string | null
          notes?: string | null
          state?: string | null
          tag?: string | null
        }
        Update: {
          ad_id?: string
          chain?: string | null
          notes?: string | null
          state?: string | null
          tag?: string | null
        }
        Relationships: []
      }
      meta_ads_raw: {
        Row: {
          delivery: string | null
          fetched_at: string | null
          id: string
          insights: Json | null
          name: string | null
        }
        Insert: {
          delivery?: string | null
          fetched_at?: string | null
          id: string
          insights?: Json | null
          name?: string | null
        }
        Update: {
          delivery?: string | null
          fetched_at?: string | null
          id?: string
          insights?: Json | null
          name?: string | null
        }
        Relationships: []
      }
      VIP_RAW_12MO: {
        Row: {
          "1 Month 1/1/2025 thru 1/31/2025  Case Equivs": string | null
          "1 Month 10/1/2024 thru 10/31/2024  Case Equivs": string | null
          "1 Month 11/1/2024 thru 11/30/2024  Case Equivs": string | null
          "1 Month 12/1/2024 thru 12/31/2024  Case Equivs": string | null
          "1 Month 2/1/2025 thru 2/28/2025  Case Equivs": string | null
          "1 Month 3/1/2025 thru 3/31/2025  Case Equivs": string | null
          "1 Month 4/1/2025 thru 4/30/2025  Case Equivs": number | null
          "1 Month 5/1/2025 thru 5/31/2025  Case Equivs": number | null
          "1 Month 6/1/2025 thru 6/30/2025  Case Equivs": string | null
          "1 Month 7/1/2025 thru 7/23/2025  Case Equivs": string | null
          "1 Month 8/1/2024 thru 8/31/2024  Case Equivs": string | null
          "1 Month 9/1/2024 thru 9/30/2024  Case Equivs": string | null
          "12 Months 8/1/2023 thru 7/23/2024  Case Equivs": string | null
          "12 Months 8/1/2024 thru 7/23/2025  Case Equivs": number | null
          "Diff  Case Equivs": number | null
          "Pct  Case Equivs": string | null
          "Retail Accounts": string
          State: string | null
        }
        Insert: {
          "1 Month 1/1/2025 thru 1/31/2025  Case Equivs"?: string | null
          "1 Month 10/1/2024 thru 10/31/2024  Case Equivs"?: string | null
          "1 Month 11/1/2024 thru 11/30/2024  Case Equivs"?: string | null
          "1 Month 12/1/2024 thru 12/31/2024  Case Equivs"?: string | null
          "1 Month 2/1/2025 thru 2/28/2025  Case Equivs"?: string | null
          "1 Month 3/1/2025 thru 3/31/2025  Case Equivs"?: string | null
          "1 Month 4/1/2025 thru 4/30/2025  Case Equivs"?: number | null
          "1 Month 5/1/2025 thru 5/31/2025  Case Equivs"?: number | null
          "1 Month 6/1/2025 thru 6/30/2025  Case Equivs"?: string | null
          "1 Month 7/1/2025 thru 7/23/2025  Case Equivs"?: string | null
          "1 Month 8/1/2024 thru 8/31/2024  Case Equivs"?: string | null
          "1 Month 9/1/2024 thru 9/30/2024  Case Equivs"?: string | null
          "12 Months 8/1/2023 thru 7/23/2024  Case Equivs"?: string | null
          "12 Months 8/1/2024 thru 7/23/2025  Case Equivs"?: number | null
          "Diff  Case Equivs"?: number | null
          "Pct  Case Equivs"?: string | null
          "Retail Accounts": string
          State?: string | null
        }
        Update: {
          "1 Month 1/1/2025 thru 1/31/2025  Case Equivs"?: string | null
          "1 Month 10/1/2024 thru 10/31/2024  Case Equivs"?: string | null
          "1 Month 11/1/2024 thru 11/30/2024  Case Equivs"?: string | null
          "1 Month 12/1/2024 thru 12/31/2024  Case Equivs"?: string | null
          "1 Month 2/1/2025 thru 2/28/2025  Case Equivs"?: string | null
          "1 Month 3/1/2025 thru 3/31/2025  Case Equivs"?: string | null
          "1 Month 4/1/2025 thru 4/30/2025  Case Equivs"?: number | null
          "1 Month 5/1/2025 thru 5/31/2025  Case Equivs"?: number | null
          "1 Month 6/1/2025 thru 6/30/2025  Case Equivs"?: string | null
          "1 Month 7/1/2025 thru 7/23/2025  Case Equivs"?: string | null
          "1 Month 8/1/2024 thru 8/31/2024  Case Equivs"?: string | null
          "1 Month 9/1/2024 thru 9/30/2024  Case Equivs"?: string | null
          "12 Months 8/1/2023 thru 7/23/2024  Case Equivs"?: string | null
          "12 Months 8/1/2024 thru 7/23/2025  Case Equivs"?: number | null
          "Diff  Case Equivs"?: number | null
          "Pct  Case Equivs"?: string | null
          "Retail Accounts"?: string
          State?: string | null
        }
        Relationships: []
      }
      vip_sales: {
        Row: {
          Address: string | null
          City: string | null
          "Dist. STATE": string | null
          "July 2025": number | null
          "June 2025": number | null
          "May 2025": number | null
          normalized_chain: string | null
          "Retail Accounts": string | null
          State: string | null
        }
        Insert: {
          Address?: string | null
          City?: string | null
          "Dist. STATE"?: string | null
          "July 2025"?: number | null
          "June 2025"?: number | null
          "May 2025"?: number | null
          normalized_chain?: string | null
          "Retail Accounts"?: string | null
          State?: string | null
        }
        Update: {
          Address?: string | null
          City?: string | null
          "Dist. STATE"?: string | null
          "July 2025"?: number | null
          "June 2025"?: number | null
          "May 2025"?: number | null
          normalized_chain?: string | null
          "Retail Accounts"?: string | null
          State?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      ad_sales_insights: {
        Row: {
          chain: string | null
          cost_per_case: number | null
          month: string | null
          state: string | null
          total_cases: number | null
          total_spend: number | null
        }
        Relationships: []
      }
      ad_tags_flattened: {
        Row: {
          ad_id: string | null
          chain: string | null
          state: string | null
        }
        Relationships: []
      }
      vip_sales_unpivoted: {
        Row: {
          cases: number | null
          month: string | null
          normalized_chain: string | null
          state: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      normalize_chain_name: {
        Args: { retail_account: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
