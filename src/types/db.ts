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
      activity_log: {
        Row: {
          actor_id: string | null
          comment_id: string | null
          created_at: string
          id: string
          is_correct: boolean | null
          issue_id: string | null
          kind: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          issue_id?: string | null
          kind: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          issue_id?: string | null
          kind?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_log_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["user_id"]
          },
        ]
      }
      banned_words: {
        Row: {
          added_at: string | null
          added_by: string | null
          category: string | null
          id: string
          word: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          category?: string | null
          id?: string
          word: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          category?: string | null
          id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "banned_words_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banned_words_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["user_id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string | null
          id: string
          issue_id: string | null
          post_id: string | null
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string | null
          id?: string
          issue_id?: string | null
          post_id?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string | null
          id?: string
          issue_id?: string | null
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "comments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          category: string
          closes_at: string | null
          created_at: string
          creator_id: string | null
          deadline: string
          description: string | null
          id: string
          is_open: boolean
          opens_at: string | null
          ranked_count_cache: number | null
          review_status: string
          settled_at: string | null
          settled_by: string | null
          settlement_note: string | null
          settlement_source: string | null
          status: string
          thumbnail_url: string | null
          title: string
          total_count_cache: number | null
          total_pct_cache: number | null
        }
        Insert: {
          category: string
          closes_at?: string | null
          created_at?: string
          creator_id?: string | null
          deadline: string
          description?: string | null
          id?: string
          is_open?: boolean
          opens_at?: string | null
          ranked_count_cache?: number | null
          review_status?: string
          settled_at?: string | null
          settled_by?: string | null
          settlement_note?: string | null
          settlement_source?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          total_count_cache?: number | null
          total_pct_cache?: number | null
        }
        Update: {
          category?: string
          closes_at?: string | null
          created_at?: string
          creator_id?: string | null
          deadline?: string
          description?: string | null
          id?: string
          is_open?: boolean
          opens_at?: string | null
          ranked_count_cache?: number | null
          review_status?: string
          settled_at?: string | null
          settled_by?: string | null
          settlement_note?: string | null
          settlement_source?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          total_count_cache?: number | null
          total_pct_cache?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "issues_settled_by_fkey"
            columns: ["settled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_settled_by_fkey"
            columns: ["settled_by"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["user_id"]
          },
        ]
      }
      judgments: {
        Row: {
          change_count: number
          committed_at: string
          counts_toward_rank: boolean
          created_at: string
          first_committed_at: string
          id: string
          is_correct: boolean | null
          issue_id: string
          stance: boolean
          user_id: string
        }
        Insert: {
          change_count?: number
          committed_at?: string
          counts_toward_rank: boolean
          created_at?: string
          first_committed_at?: string
          id?: string
          is_correct?: boolean | null
          issue_id: string
          stance: boolean
          user_id: string
        }
        Update: {
          change_count?: number
          committed_at?: string
          counts_toward_rank?: boolean
          created_at?: string
          first_committed_at?: string
          id?: string
          is_correct?: boolean | null
          issue_id?: string
          stance?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "judgments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judgments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judgments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["user_id"]
          },
        ]
      }
      post_upvotes: {
        Row: {
          created_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_upvotes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_upvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_upvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["user_id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          comment_count: number | null
          content: Json
          created_at: string | null
          id: string
          issue_id: string | null
          stance: boolean | null
          title: string
          topic_id: string | null
          upvotes: number | null
          verified_status: string | null
        }
        Insert: {
          author_id: string
          comment_count?: number | null
          content: Json
          created_at?: string | null
          id?: string
          issue_id?: string | null
          stance?: boolean | null
          title: string
          topic_id?: string | null
          upvotes?: number | null
          verified_status?: string | null
        }
        Update: {
          author_id?: string
          comment_count?: number | null
          content?: Json
          created_at?: string | null
          id?: string
          issue_id?: string | null
          stance?: boolean | null
          title?: string
          topic_id?: string | null
          upvotes?: number | null
          verified_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "posts_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_tint: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          handle: string
          id: string
          is_admin: boolean | null
          is_banned: boolean
          joined_at: string | null
          name: string
          notifications_seen_at: string
        }
        Insert: {
          avatar_tint?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          handle: string
          id: string
          is_admin?: boolean | null
          is_banned?: boolean
          joined_at?: string | null
          name: string
          notifications_seen_at?: string
        }
        Update: {
          avatar_tint?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          handle?: string
          id?: string
          is_admin?: boolean | null
          is_banned?: boolean
          joined_at?: string | null
          name?: string
          notifications_seen_at?: string
        }
        Relationships: []
      }
      topic_follows: {
        Row: {
          created_at: string | null
          topic_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          topic_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_follows_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_follows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_follows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["user_id"]
          },
        ]
      }
      topics: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          heat: number | null
          id: string
          linked_issue_id: string | null
          name: string
          participants: number | null
        }
        Insert: {
          category?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          heat?: number | null
          id?: string
          linked_issue_id?: string | null
          name: string
          participants?: number | null
        }
        Update: {
          category?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          heat?: number | null
          id?: string
          linked_issue_id?: string | null
          name?: string
          participants?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_linked_issue_id_fkey"
            columns: ["linked_issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string | null
          followee_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string | null
          followee_id: string
          follower_id: string
        }
        Update: {
          created_at?: string | null
          followee_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      admin_stats: {
        Row: {
          banned_users: number | null
          comments_24h: number | null
          judgments_24h: number | null
          new_users_24h: number | null
          new_users_7d: number | null
          open_issues: number | null
          overall_accuracy_pct: number | null
          pending_review: number | null
          posts_24h: number | null
          ranked_judgments_24h: number | null
          settled_issues: number | null
          total_comments: number | null
          total_issues: number | null
          total_judgments: number | null
          total_posts: number | null
          total_users: number | null
        }
        Relationships: []
      }
      user_accuracy: {
        Row: {
          accuracy_pct: number | null
          category: string | null
          correct_total: number | null
          settled_total: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_accuracy_by_category: {
        Row: {
          accuracy_pct: number | null
          category: string | null
          correct_total: number | null
          settled_total: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "judgments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judgments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_accuracy_overall: {
        Row: {
          accuracy_pct: number | null
          category: string | null
          correct_total: number | null
          settled_total: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "judgments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judgments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          new_comments: number | null
          new_followers: number | null
          new_likes: number | null
          new_settlements: number | null
          notifications_seen_at: string | null
          total_correct: number | null
          total_followers: number | null
          total_likes: number | null
          total_post_comments: number | null
          user_id: string | null
        }
        Insert: {
          new_comments?: never
          new_followers?: never
          new_likes?: never
          new_settlements?: never
          notifications_seen_at?: string | null
          total_correct?: never
          total_followers?: never
          total_likes?: never
          total_post_comments?: never
          user_id?: string | null
        }
        Update: {
          new_comments?: never
          new_followers?: never
          new_likes?: never
          new_settlements?: never
          notifications_seen_at?: string | null
          total_correct?: never
          total_followers?: never
          total_likes?: never
          total_post_comments?: never
          user_id?: string | null
        }
        Relationships: []
      }
      user_streak: {
        Row: {
          current_streak: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "judgments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judgments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      check_banned_words: { Args: { text_to_check: string }; Returns: string }
      get_admin_stats: {
        Args: never
        Returns: {
          banned_users: number | null
          comments_24h: number | null
          judgments_24h: number | null
          new_users_24h: number | null
          new_users_7d: number | null
          open_issues: number | null
          overall_accuracy_pct: number | null
          pending_review: number | null
          posts_24h: number | null
          ranked_judgments_24h: number | null
          settled_issues: number | null
          total_comments: number | null
          total_issues: number | null
          total_judgments: number | null
          total_posts: number | null
          total_users: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "admin_stats"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mark_notifications_seen: { Args: never; Returns: undefined }
      rate_count_comments: {
        Args: { p_seconds: number; p_user: string }
        Returns: number
      }
      rate_count_upvotes: {
        Args: { p_seconds: number; p_user: string }
        Returns: number
      }
      settle_judgments: {
        Args: { p_issue_id: string; p_result: boolean }
        Returns: undefined
      }
      toggle_upvote: {
        Args: { p_post_id: string }
        Returns: {
          count: number
          upvoted: boolean
        }[]
      }
      unsettle_issue: { Args: { p_issue_id: string }; Returns: undefined }
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
