/**
 * Supabase database types for the MCA MVP schema.
 *
 * Hand-authored to match the `supabase gen types typescript` output format so
 * it can be regenerated later (with the Supabase CLI + a container runtime or
 * an access token) without touching any consuming code.
 *
 * Source of truth: supabase/schema.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
          bio: string | null;
          locale: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          bio?: string | null;
          locale?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          bio?: string | null;
          locale?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      mentors: {
        Row: {
          id: string;
          headline: string | null;
          expertise: string[] | null;
          skills: string[] | null;
          years_experience: number | null;
          rating: number | null;
          reviews_count: number | null;
          whatsapp: string | null;
          linkedin_url: string | null;
          is_verified: boolean | null;
          is_featured: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          headline?: string | null;
          expertise?: string[] | null;
          skills?: string[] | null;
          years_experience?: number | null;
          rating?: number | null;
          reviews_count?: number | null;
          whatsapp?: string | null;
          linkedin_url?: string | null;
          is_verified?: boolean | null;
          is_featured?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          headline?: string | null;
          expertise?: string[] | null;
          skills?: string[] | null;
          years_experience?: number | null;
          rating?: number | null;
          reviews_count?: number | null;
          whatsapp?: string | null;
          linkedin_url?: string | null;
          is_verified?: boolean | null;
          is_featured?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          name_bn: string | null;
          icon: string | null;
          sort_order: number | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          name_bn?: string | null;
          icon?: string | null;
          sort_order?: number | null;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          name_bn?: string | null;
          icon?: string | null;
          sort_order?: number | null;
        };
        Relationships: [];
      };
      programs: {
        Row: {
          id: string;
          slug: string;
          title: string;
          title_bn: string | null;
          subtitle: string | null;
          description: string | null;
          description_bn: string | null;
          cover_url: string | null;
          preview_video_url: string | null;
          category_id: string | null;
          mentor_id: string | null;
          price_bdt: number;
          discount_bdt: number | null;
          level: Database["public"]["Enums"]["program_level"] | null;
          duration_minutes: number | null;
          language: string | null;
          learning_outcomes: string[] | null;
          requirements: string[] | null;
          is_featured: boolean | null;
          is_bestseller: boolean | null;
          is_trending: boolean | null;
          status: Database["public"]["Enums"]["program_status"] | null;
          rating: number | null;
          reviews_count: number | null;
          enrolled_count: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          title_bn?: string | null;
          subtitle?: string | null;
          description?: string | null;
          description_bn?: string | null;
          cover_url?: string | null;
          preview_video_url?: string | null;
          category_id?: string | null;
          mentor_id?: string | null;
          price_bdt?: number;
          discount_bdt?: number | null;
          level?: Database["public"]["Enums"]["program_level"] | null;
          duration_minutes?: number | null;
          language?: string | null;
          learning_outcomes?: string[] | null;
          requirements?: string[] | null;
          is_featured?: boolean | null;
          is_bestseller?: boolean | null;
          is_trending?: boolean | null;
          status?: Database["public"]["Enums"]["program_status"] | null;
          rating?: number | null;
          reviews_count?: number | null;
          enrolled_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          title_bn?: string | null;
          subtitle?: string | null;
          description?: string | null;
          description_bn?: string | null;
          cover_url?: string | null;
          preview_video_url?: string | null;
          category_id?: string | null;
          mentor_id?: string | null;
          price_bdt?: number;
          discount_bdt?: number | null;
          level?: Database["public"]["Enums"]["program_level"] | null;
          duration_minutes?: number | null;
          language?: string | null;
          learning_outcomes?: string[] | null;
          requirements?: string[] | null;
          is_featured?: boolean | null;
          is_bestseller?: boolean | null;
          is_trending?: boolean | null;
          status?: Database["public"]["Enums"]["program_status"] | null;
          rating?: number | null;
          reviews_count?: number | null;
          enrolled_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      modules: {
        Row: {
          id: string;
          program_id: string | null;
          title: string;
          sort_order: number | null;
        };
        Insert: {
          id?: string;
          program_id?: string | null;
          title: string;
          sort_order?: number | null;
        };
        Update: {
          id?: string;
          program_id?: string | null;
          title?: string;
          sort_order?: number | null;
        };
        Relationships: [];
      };
      lessons: {
        Row: {
          id: string;
          module_id: string | null;
          title: string;
          video_url: string | null;
          content_md: string | null;
          duration_seconds: number | null;
          is_preview: boolean | null;
          sort_order: number | null;
        };
        Insert: {
          id?: string;
          module_id?: string | null;
          title: string;
          video_url?: string | null;
          content_md?: string | null;
          duration_seconds?: number | null;
          is_preview?: boolean | null;
          sort_order?: number | null;
        };
        Update: {
          id?: string;
          module_id?: string | null;
          title?: string;
          video_url?: string | null;
          content_md?: string | null;
          duration_seconds?: number | null;
          is_preview?: boolean | null;
          sort_order?: number | null;
        };
        Relationships: [];
      };
      enrollments: {
        Row: {
          id: string;
          user_id: string | null;
          program_id: string | null;
          progress: number | null;
          completed_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          program_id?: string | null;
          progress?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          program_id?: string | null;
          progress?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      lesson_progress: {
        Row: {
          user_id: string;
          lesson_id: string;
          is_completed: boolean | null;
          seconds_watched: number | null;
          notes: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          lesson_id: string;
          is_completed?: boolean | null;
          seconds_watched?: number | null;
          notes?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          lesson_id?: string;
          is_completed?: boolean | null;
          seconds_watched?: number | null;
          notes?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          slug: string;
          title: string;
          author: string | null;
          kind: Database["public"]["Enums"]["resource_kind"];
          cover_url: string | null;
          description: string | null;
          price_bdt: number;
          file_storage_path: string | null;
          sample_storage_path: string | null;
          external_url: string | null;
          pages: number | null;
          is_featured: boolean | null;
          is_premium: boolean | null;
          status: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          author?: string | null;
          kind?: Database["public"]["Enums"]["resource_kind"];
          cover_url?: string | null;
          description?: string | null;
          price_bdt?: number;
          file_storage_path?: string | null;
          sample_storage_path?: string | null;
          external_url?: string | null;
          pages?: number | null;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          status?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          author?: string | null;
          kind?: Database["public"]["Enums"]["resource_kind"];
          cover_url?: string | null;
          description?: string | null;
          price_bdt?: number;
          file_storage_path?: string | null;
          sample_storage_path?: string | null;
          external_url?: string | null;
          pages?: number | null;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          status?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      resource_access: {
        Row: {
          id: string;
          user_id: string | null;
          resource_id: string | null;
          order_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          resource_id?: string | null;
          order_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          resource_id?: string | null;
          order_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          total_bdt: number;
          status: Database["public"]["Enums"]["order_status"] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          total_bdt: number;
          status?: Database["public"]["Enums"]["order_status"] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          total_bdt?: number;
          status?: Database["public"]["Enums"]["order_status"] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string | null;
          item_type: string | null;
          item_id: string;
          title: string | null;
          price_bdt: number;
          quantity: number | null;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          item_type?: string | null;
          item_id: string;
          title?: string | null;
          price_bdt: number;
          quantity?: number | null;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          item_type?: string | null;
          item_id?: string;
          title?: string | null;
          price_bdt?: number;
          quantity?: number | null;
        };
        Relationships: [];
      };
      manual_payment_submissions: {
        Row: {
          id: string;
          order_id: string | null;
          user_id: string | null;
          method: string;
          sender_number: string;
          transaction_id: string;
          paid_amount_bdt: number;
          screenshot_path: string | null;
          status: Database["public"]["Enums"]["submission_status"] | null;
          admin_note: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          user_id?: string | null;
          method?: string;
          sender_number: string;
          transaction_id: string;
          paid_amount_bdt: number;
          screenshot_path?: string | null;
          status?: Database["public"]["Enums"]["submission_status"] | null;
          admin_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          user_id?: string | null;
          method?: string;
          sender_number?: string;
          transaction_id?: string;
          paid_amount_bdt?: number;
          screenshot_path?: string | null;
          status?: Database["public"]["Enums"]["submission_status"] | null;
          admin_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          student_id: string | null;
          mentor_id: string | null;
          program_id: string | null;
          title: string | null;
          body: string | null;
          visibility: Database["public"]["Enums"]["question_visibility"] | null;
          status: Database["public"]["Enums"]["question_status"] | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          student_id?: string | null;
          mentor_id?: string | null;
          program_id?: string | null;
          title?: string | null;
          body?: string | null;
          visibility?: Database["public"]["Enums"]["question_visibility"] | null;
          status?: Database["public"]["Enums"]["question_status"] | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string | null;
          mentor_id?: string | null;
          program_id?: string | null;
          title?: string | null;
          body?: string | null;
          visibility?: Database["public"]["Enums"]["question_visibility"] | null;
          status?: Database["public"]["Enums"]["question_status"] | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      answers: {
        Row: {
          id: string;
          question_id: string | null;
          author_id: string | null;
          body: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          question_id?: string | null;
          author_id?: string | null;
          body: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          question_id?: string | null;
          author_id?: string | null;
          body?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      live_classes: {
        Row: {
          id: string;
          program_id: string | null;
          mentor_id: string | null;
          title: string;
          description: string | null;
          starts_at: string;
          ends_at: string | null;
          meeting_url: string | null;
          replay_url: string | null;
          is_public: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          program_id?: string | null;
          mentor_id?: string | null;
          title: string;
          description?: string | null;
          starts_at: string;
          ends_at?: string | null;
          meeting_url?: string | null;
          replay_url?: string | null;
          is_public?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          program_id?: string | null;
          mentor_id?: string | null;
          title?: string;
          description?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          meeting_url?: string | null;
          replay_url?: string | null;
          is_public?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      mock_tests: {
        Row: {
          id: string;
          slug: string;
          title: string;
          category_id: string | null;
          test_type: Database["public"]["Enums"]["test_type"] | null;
          duration_minutes: number | null;
          total_marks: number | null;
          is_free: boolean | null;
          price_bdt: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          category_id?: string | null;
          test_type?: Database["public"]["Enums"]["test_type"] | null;
          duration_minutes?: number | null;
          total_marks?: number | null;
          is_free?: boolean | null;
          price_bdt?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          category_id?: string | null;
          test_type?: Database["public"]["Enums"]["test_type"] | null;
          duration_minutes?: number | null;
          total_marks?: number | null;
          is_free?: boolean | null;
          price_bdt?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      mock_questions: {
        Row: {
          id: string;
          mock_test_id: string | null;
          question: string;
          options: Json;
          correct_key: string;
          marks: number | null;
          explanation: string | null;
          sort_order: number | null;
        };
        Insert: {
          id?: string;
          mock_test_id?: string | null;
          question: string;
          options: Json;
          correct_key: string;
          marks?: number | null;
          explanation?: string | null;
          sort_order?: number | null;
        };
        Update: {
          id?: string;
          mock_test_id?: string | null;
          question?: string;
          options?: Json;
          correct_key?: string;
          marks?: number | null;
          explanation?: string | null;
          sort_order?: number | null;
        };
        Relationships: [];
      };
      test_attempts: {
        Row: {
          id: string;
          user_id: string | null;
          mock_test_id: string | null;
          score: number | null;
          total: number | null;
          answers: Json | null;
          started_at: string | null;
          submitted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          mock_test_id?: string | null;
          score?: number | null;
          total?: number | null;
          answers?: Json | null;
          started_at?: string | null;
          submitted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          mock_test_id?: string | null;
          score?: number | null;
          total?: number | null;
          answers?: Json | null;
          started_at?: string | null;
          submitted_at?: string | null;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          title_bn: string | null;
          excerpt: string | null;
          cover_url: string | null;
          content_md: string | null;
          author_id: string | null;
          status: Database["public"]["Enums"]["post_status"] | null;
          published_at: string | null;
          tags: string[] | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          title_bn?: string | null;
          excerpt?: string | null;
          cover_url?: string | null;
          content_md?: string | null;
          author_id?: string | null;
          status?: Database["public"]["Enums"]["post_status"] | null;
          published_at?: string | null;
          tags?: string[] | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          title_bn?: string | null;
          excerpt?: string | null;
          cover_url?: string | null;
          content_md?: string | null;
          author_id?: string | null;
          status?: Database["public"]["Enums"]["post_status"] | null;
          published_at?: string | null;
          tags?: string[] | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      bookmarks: {
        Row: {
          user_id: string;
          item_type: string;
          item_id: string;
          created_at: string | null;
        };
        Insert: {
          user_id: string;
          item_type: string;
          item_id: string;
          created_at?: string | null;
        };
        Update: {
          user_id?: string;
          item_type?: string;
          item_id?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          subject: string | null;
          body: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email?: string | null;
          subject?: string | null;
          body?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          subject?: string | null;
          body?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      payment_settings: {
        Row: {
          id: string;
          label: string | null;
          bkash_number: string;
          instructions: string | null;
          is_active: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          label?: string | null;
          bkash_number: string;
          instructions?: string | null;
          is_active?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          label?: string | null;
          bkash_number?: string;
          instructions?: string | null;
          is_active?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: string;
          whatsapp_enabled: boolean;
          whatsapp_connection: string;
          whatsapp_number: string | null;
          whatsapp_link: string | null;
          whatsapp_message: string | null;
          whatsapp_position: string;
          whatsapp_size: string;
          whatsapp_animation: boolean;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          whatsapp_enabled?: boolean;
          whatsapp_connection?: string;
          whatsapp_number?: string | null;
          whatsapp_link?: string | null;
          whatsapp_message?: string | null;
          whatsapp_position?: string;
          whatsapp_size?: string;
          whatsapp_animation?: boolean;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          whatsapp_enabled?: boolean;
          whatsapp_connection?: string;
          whatsapp_number?: string | null;
          whatsapp_link?: string | null;
          whatsapp_message?: string | null;
          whatsapp_position?: string;
          whatsapp_size?: string;
          whatsapp_animation?: boolean;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      // Non-null base columns (id, slug, title, kind, price_bdt, question, ...)
      // stay non-null here so consumers don't inherit spurious nullability.
      public_mentor_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
        };
        Relationships: [];
      };
      public_resources: {
        Row: {
          id: string;
          slug: string;
          title: string;
          author: string | null;
          kind: Database["public"]["Enums"]["resource_kind"];
          cover_url: string | null;
          description: string | null;
          price_bdt: number;
          external_url: string | null;
          pages: number | null;
          is_featured: boolean | null;
          is_premium: boolean | null;
          status: string;
          created_at: string | null;
        };
        Relationships: [];
      };
      public_mock_questions: {
        Row: {
          id: string;
          mock_test_id: string | null;
          question: string;
          options: Json;
          marks: number | null;
          sort_order: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: "student" | "mentor" | "admin";
      program_level: "beginner" | "intermediate" | "advanced" | "all_levels";
      program_status: "draft" | "published" | "archived";
      question_status: "waiting" | "answered" | "closed";
      question_visibility: "private" | "community";
      resource_kind:
        | "ebook"
        | "cv_template"
        | "roadmap"
        | "interview"
        | "productivity"
        | "scholarship"
        | "other";
      order_status:
        | "pending_payment"
        | "pending_verification"
        | "paid"
        | "rejected"
        | "cancelled";
      submission_status: "submitted" | "approved" | "rejected";
      post_status: "draft" | "published";
      test_type: "topic" | "practice" | "full";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];

export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];
