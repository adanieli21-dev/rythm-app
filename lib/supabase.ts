import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Database {
  public: {
    Tables: {
      systems: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          trigger: string;
          full_action: string;
          survival_action: string;
          is_paused: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          trigger: string;
          full_action: string;
          survival_action: string;
          is_paused?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          trigger?: string;
          full_action?: string;
          survival_action?: string;
          is_paused?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_logs: {
        Row: {
          id: string;
          user_id: string;
          system_id: string;
          date: string;
          status: 'done' | 'survival' | 'skip' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          system_id: string;
          date: string;
          status?: 'done' | 'survival' | 'skip' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          system_id?: string;
          date?: string;
          status?: 'done' | 'survival' | 'skip' | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      weekly_syncs: {
        Row: {
          id: string;
          user_id: string;
          week_ending: string;
          win: string;
          patterns: string;
          hard_days: string | null;
          adjust_system: string;
          adjust_description: string | null;
          intention: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_ending: string;
          win: string;
          patterns: string;
          hard_days?: string | null;
          adjust_system: string;
          adjust_description?: string | null;
          intention?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_ending?: string;
          win?: string;
          patterns?: string;
          hard_days?: string | null;
          adjust_system?: string;
          adjust_description?: string | null;
          intention?: string | null;
          created_at?: string;
        };
      };
      user_settings: {
        Row: {
          user_id: string;
          survival_mode: boolean;
          tracker_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          survival_mode?: boolean;
          tracker_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          survival_mode?: boolean;
          tracker_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
