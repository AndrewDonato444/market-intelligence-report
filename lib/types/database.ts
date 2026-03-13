export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      api_usage: {
        Row: {
          cached: number
          cost: number
          created_at: string
          endpoint: string
          id: string
          provider: string
          report_id: string | null
          response_time_ms: number | null
          status_code: number | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          cached?: number
          cost?: number
          created_at?: string
          endpoint: string
          id?: string
          provider: string
          report_id?: string | null
          response_time_ms?: number | null
          status_code?: number | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          cached?: number
          cost?: number
          created_at?: string
          endpoint?: string
          id?: string
          provider?: string
          report_id?: string | null
          response_time_ms?: number | null
          status_code?: number | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cache: {
        Row: {
          created_at: string
          data: Json
          expires_at: string
          id: string
          key: string
          source: string
          ttl_seconds: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: Json
          expires_at: string
          id?: string
          key: string
          source: string
          ttl_seconds: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          key?: string
          source?: string
          ttl_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      markets: {
        Row: {
          created_at: string
          geography: Json
          id: string
          is_default: number
          luxury_tier: Database["public"]["Enums"]["luxury_tier"]
          name: string
          peer_markets: Json | null
          price_ceiling: number | null
          price_floor: number
          property_types: Json | null
          segments: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          geography: Json
          id?: string
          is_default?: number
          luxury_tier?: Database["public"]["Enums"]["luxury_tier"]
          name: string
          peer_markets?: Json | null
          price_ceiling?: number | null
          price_floor?: number
          property_types?: Json | null
          segments?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          geography?: Json
          id?: string
          is_default?: number
          luxury_tier?: Database["public"]["Enums"]["luxury_tier"]
          name?: string
          peer_markets?: Json | null
          price_ceiling?: number | null
          price_floor?: number
          property_types?: Json | null
          segments?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "markets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      report_sections: {
        Row: {
          agent_name: string | null
          content: Json
          created_at: string
          generated_at: string | null
          id: string
          report_id: string
          section_type: Database["public"]["Enums"]["report_section_type"]
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          agent_name?: string | null
          content: Json
          created_at?: string
          generated_at?: string | null
          id?: string
          report_id: string
          section_type: Database["public"]["Enums"]["report_section_type"]
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          agent_name?: string | null
          content?: Json
          created_at?: string
          generated_at?: string | null
          id?: string
          report_id?: string
          section_type?: Database["public"]["Enums"]["report_section_type"]
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_sections_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          config: Json | null
          created_at: string
          error_message: string | null
          generation_completed_at: string | null
          generation_started_at: string | null
          id: string
          market_id: string
          output_url: string | null
          parent_report_id: string | null
          pdf_url: string | null
          status: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          config?: Json | null
          created_at?: string
          error_message?: string | null
          generation_completed_at?: string | null
          generation_started_at?: string | null
          id?: string
          market_id: string
          output_url?: string | null
          parent_report_id?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          config?: Json | null
          created_at?: string
          error_message?: string | null
          generation_completed_at?: string | null
          generation_started_at?: string | null
          id?: string
          market_id?: string
          output_url?: string | null
          parent_report_id?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "reports_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          bio: string | null
          brand_colors: Json | null
          clerk_id: string
          company: string | null
          created_at: string
          email: string
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          brand_colors?: Json | null
          clerk_id: string
          company?: string | null
          created_at?: string
          email: string
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          brand_colors?: Json | null
          clerk_id?: string
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      luxury_tier: "luxury" | "high_luxury" | "ultra_luxury"
      report_section_type:
        | "market_overview"
        | "executive_summary"
        | "second_homes"
        | "key_drivers"
        | "competitive_analysis"
        | "trending_insights"
        | "forecasts"
        | "methodology"
        | "strategic_summary"
        | "executive_briefing"
        | "market_insights_index"
        | "luxury_market_dashboard"
        | "neighborhood_intelligence"
        | "the_narrative"
        | "forward_look"
        | "comparative_positioning"
        | "strategic_benchmark"
        | "disclaimer_methodology"
        | "persona_intelligence"
      report_status: "queued" | "generating" | "completed" | "failed"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      luxury_tier: ["luxury", "high_luxury", "ultra_luxury"],
      report_section_type: [
        "market_overview",
        "executive_summary",
        "second_homes",
        "key_drivers",
        "competitive_analysis",
        "trending_insights",
        "forecasts",
        "methodology",
        "strategic_summary",
        "executive_briefing",
        "market_insights_index",
        "luxury_market_dashboard",
        "neighborhood_intelligence",
        "the_narrative",
        "forward_look",
        "comparative_positioning",
        "strategic_benchmark",
        "disclaimer_methodology",
        "persona_intelligence",
      ],
      report_status: ["queued", "generating", "completed", "failed"],
    },
  },
} as const

