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
      assets: {
        Row: {
          category: Database["public"]["Enums"]["asset_category"]
          created_at: string
          currency: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["asset_category"]
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["asset_category"]
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      calculation_heirs: {
        Row: {
          blocked_by: string | null
          calculation_id: string
          created_at: string
          fixed_share: string | null
          heir_id: string
          id: string
          is_blocked: boolean
          is_residuary: boolean
          relationship: Database["public"]["Enums"]["heir_relationship"]
          share_amount: number
          share_fraction: number
          share_percentage: number
        }
        Insert: {
          blocked_by?: string | null
          calculation_id: string
          created_at?: string
          fixed_share?: string | null
          heir_id: string
          id?: string
          is_blocked?: boolean
          is_residuary?: boolean
          relationship: Database["public"]["Enums"]["heir_relationship"]
          share_amount?: number
          share_fraction?: number
          share_percentage?: number
        }
        Update: {
          blocked_by?: string | null
          calculation_id?: string
          created_at?: string
          fixed_share?: string | null
          heir_id?: string
          id?: string
          is_blocked?: boolean
          is_residuary?: boolean
          relationship?: Database["public"]["Enums"]["heir_relationship"]
          share_amount?: number
          share_fraction?: number
          share_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "calculation_heirs_calculation_id_fkey"
            columns: ["calculation_id"]
            isOneToOne: false
            referencedRelation: "calculations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calculation_heirs_heir_id_fkey"
            columns: ["heir_id"]
            isOneToOne: false
            referencedRelation: "heirs"
            referencedColumns: ["id"]
          },
        ]
      }
      calculations: {
        Row: {
          awl_applied: boolean
          created_at: string
          currency: string
          id: string
          radd_applied: boolean
          title: string
          total_estate: number
          updated_at: string
          user_id: string
        }
        Insert: {
          awl_applied?: boolean
          created_at?: string
          currency: string
          id?: string
          radd_applied?: boolean
          title?: string
          total_estate?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          awl_applied?: boolean
          created_at?: string
          currency?: string
          id?: string
          radd_applied?: boolean
          title?: string
          total_estate?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      heirs: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          relationship: Database["public"]["Enums"]["heir_relationship"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          relationship: Database["public"]["Enums"]["heir_relationship"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          relationship?: Database["public"]["Enums"]["heir_relationship"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          currency: string
          id: string
          language: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          language?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          language?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      asset_category: "cash" | "real_estate" | "jewelry" | "valuables" | "other"
      heir_relationship:
        | "son"
        | "daughter"
        | "father"
        | "mother"
        | "husband"
        | "wife"
        | "full_brother"
        | "full_sister"
        | "paternal_brother"
        | "paternal_sister"
        | "maternal_brother"
        | "maternal_sister"
        | "grandfather"
        | "grandmother"
        | "grandson"
        | "granddaughter"
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
      asset_category: ["cash", "real_estate", "jewelry", "valuables", "other"],
      heir_relationship: [
        "son",
        "daughter",
        "father",
        "mother",
        "husband",
        "wife",
        "full_brother",
        "full_sister",
        "paternal_brother",
        "paternal_sister",
        "maternal_brother",
        "maternal_sister",
        "grandfather",
        "grandmother",
        "grandson",
        "granddaughter",
      ],
    },
  },
} as const
