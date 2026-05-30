export type FeedbackKind = 'bug' | 'confusing' | 'suggestion' | 'praise';
export type FeedbackStatus = 'new' | 'reviewing' | 'done' | 'wont_fix';

export interface Database {
  public: {
    Tables: {
      feedback_testers: {
        Row: {
          id: string;
          display_name: string;
          email: string | null;
          active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          display_name: string;
          email?: string | null;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          email?: string | null;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      feedback_submissions: {
        Row: {
          id: string;
          tester_id: string | null;
          tester_name: string;
          type: FeedbackKind;
          message: string;
          page_path: string | null;
          user_agent: string | null;
          viewport_width: number | null;
          viewport_height: number | null;
          status: FeedbackStatus;
          admin_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tester_id?: string | null;
          tester_name: string;
          type: FeedbackKind;
          message: string;
          page_path?: string | null;
          user_agent?: string | null;
          viewport_width?: number | null;
          viewport_height?: number | null;
          status?: FeedbackStatus;
          admin_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tester_id?: string | null;
          tester_name?: string;
          type?: FeedbackKind;
          message?: string;
          page_path?: string | null;
          user_agent?: string | null;
          viewport_width?: number | null;
          viewport_height?: number | null;
          status?: FeedbackStatus;
          admin_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      feedback_kind: FeedbackKind;
      feedback_status: FeedbackStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
