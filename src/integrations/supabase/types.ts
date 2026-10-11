export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: "PASSENGER" | "ADMIN";
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          role?: "PASSENGER" | "ADMIN";
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: "PASSENGER" | "ADMIN";
          created_at?: string;
        };
        Relationships: [];
      };
      stations: {
        Row: {
          id: string;
          code: string;
          name: string;
          city: string;
          state: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          city: string;
          state: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          city?: string;
          state?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      trains: {
        Row: {
          id: string;
          number: string;
          name: string;
          from_station: string;
          to_station: string;
          departure: string;
          arrival: string;
          fare: number;
          seats: number;
          rac_total: number;
          wl_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          number: string;
          name: string;
          from_station: string;
          to_station: string;
          departure: string;
          arrival: string;
          fare: number;
          seats?: number;
          rac_total?: number;
          wl_total?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          number?: string;
          name?: string;
          from_station?: string;
          to_station?: string;
          departure?: string;
          arrival?: string;
          fare?: number;
          seats?: number;
          rac_total?: number;
          wl_total?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      train_stops: {
        Row: {
          id: string;
          train_id: string;
          station_id: string;
          stop_number: number;
          arrival_time: string;
          departure_time: string;
          distance_km: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          train_id: string;
          station_id: string;
          stop_number: number;
          arrival_time: string;
          departure_time: string;
          distance_km?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          train_id?: string;
          station_id?: string;
          stop_number?: number;
          arrival_time?: string;
          departure_time?: string;
          distance_km?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "train_stops_train_id_fkey";
            columns: ["train_id"];
            isOneToOne: false;
            referencedRelation: "trains";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "train_stops_station_id_fkey";
            columns: ["station_id"];
            isOneToOne: false;
            referencedRelation: "stations";
            referencedColumns: ["id"];
          },
        ];
      };
      coaches: {
        Row: {
          id: string;
          train_id: string;
          coach_number: string;
          coach_type: string;
          total_seats: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          train_id: string;
          coach_number: string;
          coach_type?: string;
          total_seats?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          train_id?: string;
          coach_number?: string;
          coach_type?: string;
          total_seats?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coaches_train_id_fkey";
            columns: ["train_id"];
            isOneToOne: false;
            referencedRelation: "trains";
            referencedColumns: ["id"];
          },
        ];
      };
      seats: {
        Row: {
          id: string;
          train_id: string;
          coach_id: string | null;
          coach: string;
          seat_number: number;
          berth: "Lower" | "Middle" | "Upper";
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          train_id: string;
          coach_id?: string | null;
          coach?: string;
          seat_number: number;
          berth: "Lower" | "Middle" | "Upper";
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          train_id?: string;
          coach_id?: string | null;
          coach?: string;
          seat_number?: number;
          berth?: "Lower" | "Middle" | "Upper";
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seats_train_id_fkey";
            columns: ["train_id"];
            isOneToOne: false;
            referencedRelation: "trains";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "seats_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "coaches";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          pnr: string;
          user_id: string;
          train_id: string;
          passenger_name: string;
          age: number;
          gender: "Male" | "Female" | "Other";
          preference: "Lower" | "Middle" | "Upper" | "No Preference";
          status: "CONFIRMED" | "RAC" | "WAITLIST" | "CANCELLED";
          seat_number: number | null;
          berth: "Lower" | "Middle" | "Upper" | null;
          queue_position: number | null;
          fare: number;
          journey_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          pnr: string;
          user_id: string;
          train_id: string;
          passenger_name: string;
          age: number;
          gender: "Male" | "Female" | "Other";
          preference?: "Lower" | "Middle" | "Upper" | "No Preference";
          status: "CONFIRMED" | "RAC" | "WAITLIST" | "CANCELLED";
          seat_number?: number | null;
          berth?: "Lower" | "Middle" | "Upper" | null;
          queue_position?: number | null;
          fare: number;
          journey_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          pnr?: string;
          user_id?: string;
          train_id?: string;
          passenger_name?: string;
          age?: number;
          gender?: "Male" | "Female" | "Other";
          preference?: "Lower" | "Middle" | "Upper" | "No Preference";
          status?: "CONFIRMED" | "RAC" | "WAITLIST" | "CANCELLED";
          seat_number?: number | null;
          berth?: "Lower" | "Middle" | "Upper" | null;
          queue_position?: number | null;
          fare?: number;
          journey_date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_train_id_fkey";
            columns: ["train_id"];
            isOneToOne: false;
            referencedRelation: "trains";
            referencedColumns: ["id"];
          },
        ];
      };
      passengers: {
        Row: {
          id: string;
          booking_id: string;
          name: string;
          age: number;
          gender: "Male" | "Female" | "Other";
          berth_preference: "Lower" | "Middle" | "Upper" | "No Preference";
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          name: string;
          age: number;
          gender: "Male" | "Female" | "Other";
          berth_preference: "Lower" | "Middle" | "Upper" | "No Preference";
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          name?: string;
          age?: number;
          gender?: "Male" | "Female" | "Other";
          berth_preference?: "Lower" | "Middle" | "Upper" | "No Preference";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "passengers_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      book_ticket: {
        Args: {
          p_train_id: string;
          p_passenger_name: string;
          p_age: number;
          p_gender: "Male" | "Female" | "Other";
          p_preference: "Lower" | "Middle" | "Upper" | "No Preference";
        };
        Returns: Json;
      };
      cancel_ticket: {
        Args: {
          p_booking_id: string;
        };
        Returns: Json;
      };
      signup_without_confirmation: {
        Args: {
          p_email: string;
          p_password: string;
          p_name?: string;
          p_role?: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      app_role: "PASSENGER" | "ADMIN";
      berth_type: "Lower" | "Middle" | "Upper";
      berth_preference: "Lower" | "Middle" | "Upper" | "No Preference";
      gender_type: "Male" | "Female" | "Other";
      booking_status: "CONFIRMED" | "RAC" | "WAITLIST" | "CANCELLED";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;
