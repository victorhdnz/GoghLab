// Tipos TypeScript gerados do schema do Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Tipos auxiliares para o sistema de membros
export type PlanId = 'gogh_essencial' | 'gogh_pro'
export type BillingCycle = 'monthly' | 'annual'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete'
export type TicketType = 'canva_access' | 'capcut_access' | 'general' | 'bug_report' | 'feature_request'
export type TicketStatus = 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'
export type ToolType = 'canva' | 'capcut'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          contact_phone: string | null
          avatar_url: string | null
          role: 'customer' | 'editor' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          contact_phone?: string | null
          avatar_url?: string | null
          role?: 'customer' | 'editor' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          contact_phone?: string | null
          avatar_url?: string | null
          role?: 'customer' | 'editor' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          stripe_price_id: string
          plan_id: PlanId
          billing_cycle: BillingCycle
          status: SubscriptionStatus
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          stripe_price_id: string
          plan_id: PlanId
          billing_cycle: BillingCycle
          status?: SubscriptionStatus
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          stripe_price_id?: string
          plan_id?: PlanId
          billing_cycle?: BillingCycle
          status?: SubscriptionStatus
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      plan_features: {
        Row: {
          id: string
          plan_id: PlanId
          feature_key: string
          feature_name: string
          feature_description: string | null
          monthly_limit: number | null
          is_enabled: boolean
          created_at: string
        }
        Insert: {
          id?: string
          plan_id: PlanId
          feature_key: string
          feature_name: string
          feature_description?: string | null
          monthly_limit?: number | null
          is_enabled?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          plan_id?: PlanId
          feature_key?: string
          feature_name?: string
          feature_description?: string | null
          monthly_limit?: number | null
          is_enabled?: boolean
          created_at?: string
        }
      }
      user_usage: {
        Row: {
          id: string
          user_id: string
          feature_key: string
          usage_count: number
          period_start: string
          period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          feature_key: string
          usage_count?: number
          period_start: string
          period_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          feature_key?: string
          usage_count?: number
          period_start?: string
          period_end?: string
          created_at?: string
          updated_at?: string
        }
      }
      ai_agents: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          avatar_url: string | null
          system_prompt: string
          model: string
          is_active: boolean
          is_premium: boolean
          order_position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          avatar_url?: string | null
          system_prompt: string
          model?: string
          is_active?: boolean
          is_premium?: boolean
          order_position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          avatar_url?: string | null
          system_prompt?: string
          model?: string
          is_active?: boolean
          is_premium?: boolean
          order_position?: number
          created_at?: string
          updated_at?: string
        }
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          agent_id: string
          title: string
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_id: string
          title?: string
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string
          title?: string
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ai_messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          tokens_used: number
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          tokens_used?: number
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          tokens_used?: number
          created_at?: string
        }
      }
      support_tickets: {
        Row: {
          id: string
          user_id: string
          ticket_type: TicketType
          subject: string
          status: TicketStatus
          priority: TicketPriority
          assigned_to: string | null
          created_at: string
          updated_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          ticket_type: TicketType
          subject: string
          status?: TicketStatus
          priority?: TicketPriority
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          ticket_type?: TicketType
          subject?: string
          status?: TicketStatus
          priority?: TicketPriority
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
        }
      }
      support_messages: {
        Row: {
          id: string
          ticket_id: string
          sender_id: string
          content: string
          attachments: Json
          is_internal: boolean
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          sender_id: string
          content: string
          attachments?: Json
          is_internal?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          sender_id?: string
          content?: string
          attachments?: Json
          is_internal?: boolean
          created_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          slug: string
          title: string
          description: string | null
          thumbnail_url: string | null
          instructor_name: string | null
          instructor_avatar: string | null
          duration_hours: number
          lessons_count: number
          plan_required: 'gogh_essencial' | 'gogh_pro' | 'all'
          is_featured: boolean
          is_published: boolean
          order_position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
          instructor_name?: string | null
          instructor_avatar?: string | null
          duration_hours?: number
          lessons_count?: number
          plan_required?: 'gogh_essencial' | 'gogh_pro' | 'all'
          is_featured?: boolean
          is_published?: boolean
          order_position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          instructor_name?: string | null
          instructor_avatar?: string | null
          duration_hours?: number
          lessons_count?: number
          plan_required?: 'gogh_essencial' | 'gogh_pro' | 'all'
          is_featured?: boolean
          is_published?: boolean
          order_position?: number
          created_at?: string
          updated_at?: string
        }
      }
      course_modules: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          order_position: number
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          order_position?: number
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          order_position?: number
          created_at?: string
        }
      }
      course_lessons: {
        Row: {
          id: string
          course_id: string
          module_id: string | null
          title: string
          description: string | null
          video_url: string | null
          duration_minutes: number
          is_free_preview: boolean
          order_position: number
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          module_id?: string | null
          title: string
          description?: string | null
          video_url?: string | null
          duration_minutes?: number
          is_free_preview?: boolean
          order_position?: number
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          module_id?: string | null
          title?: string
          description?: string | null
          video_url?: string | null
          duration_minutes?: number
          is_free_preview?: boolean
          order_position?: number
          created_at?: string
        }
      }
      user_course_progress: {
        Row: {
          id: string
          user_id: string
          course_id: string
          lesson_id: string
          completed: boolean
          progress_percent: number
          last_watched_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          lesson_id: string
          completed?: boolean
          progress_percent?: number
          last_watched_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          lesson_id?: string
          completed?: boolean
          progress_percent?: number
          last_watched_at?: string
          completed_at?: string | null
        }
      }
      user_niche_profiles: {
        Row: {
          id: string
          user_id: string
          business_name: string | null
          niche: string | null
          target_audience: string | null
          brand_voice: string | null
          content_pillars: Json
          competitors: Json
          goals: string | null
          platforms: Json
          additional_context: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name?: string | null
          niche?: string | null
          target_audience?: string | null
          brand_voice?: string | null
          content_pillars?: Json
          competitors?: Json
          goals?: string | null
          platforms?: Json
          additional_context?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string | null
          niche?: string | null
          target_audience?: string | null
          brand_voice?: string | null
          content_pillars?: Json
          competitors?: Json
          goals?: string | null
          platforms?: Json
          additional_context?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tool_access_credentials: {
        Row: {
          id: string
          user_id: string
          tool_type: ToolType
          email: string
          access_granted_at: string
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tool_type: ToolType
          email: string
          access_granted_at?: string
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tool_type?: ToolType
          email?: string
          access_granted_at?: string
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          cep: string
          street: string
          number: string
          complement: string | null
          neighborhood: string
          city: string
          state: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          cep: string
          street: string
          number: string
          complement?: string | null
          neighborhood: string
          city: string
          state: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cep?: string
          street?: string
          number?: string
          complement?: string | null
          neighborhood?: string
          city?: string
          state?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          bling_id: string | null
          name: string
          slug: string
          description: string | null
          short_description: string | null
          bling_price: number | null
          local_price: number
          national_price: number
          stock: number
          is_featured: boolean
          is_active: boolean
          weight: number | null
          width: number | null
          height: number | null
          length: number | null
          category: string | null
          tags: string[] | null
          meta_title: string | null
          meta_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bling_id?: string | null
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          bling_price?: number | null
          local_price: number
          national_price: number
          stock?: number
          is_featured?: boolean
          is_active?: boolean
          weight?: number | null
          width?: number | null
          height?: number | null
          length?: number | null
          category?: string | null
          tags?: string[] | null
          meta_title?: string | null
          meta_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bling_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          bling_price?: number | null
          local_price?: number
          national_price?: number
          stock?: number
          is_featured?: boolean
          is_active?: boolean
          weight?: number | null
          width?: number | null
          height?: number | null
          length?: number | null
          category?: string | null
          tags?: string[] | null
          meta_title?: string | null
          meta_description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      product_colors: {
        Row: {
          id: string
          product_id: string
          color_name: string
          color_hex: string
          images: string[]
          stock: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          color_name: string
          color_hex: string
          images?: string[]
          stock?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          color_name?: string
          color_hex?: string
          images?: string[]
          stock?: number
          is_active?: boolean
          created_at?: string
        }
      }
      product_gifts: {
        Row: {
          id: string
          product_id: string
          gift_product_id: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          gift_product_id: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          gift_product_id?: string
          is_active?: boolean
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string | null
          customer_name: string
          rating: number
          comment: string
          is_approved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id?: string | null
          customer_name: string
          rating: number
          comment: string
          is_approved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string | null
          customer_name?: string
          rating?: number
          comment?: string
          is_approved?: boolean
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string
          status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          subtotal: number
          shipping_cost: number
          total: number
          payment_method: string | null
          payment_status: string
          shipping_address: Json
          tracking_code: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          user_id: string
          status?: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          subtotal: number
          shipping_cost: number
          total: number
          payment_method?: string | null
          payment_status?: string
          shipping_address: Json
          tracking_code?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string
          status?: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          subtotal?: number
          shipping_cost?: number
          total?: number
          payment_method?: string | null
          payment_status?: string
          shipping_address?: Json
          tracking_code?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          color_id: string | null
          quantity: number
          unit_price: number
          subtotal: number
          is_gift: boolean
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          color_id?: string | null
          quantity: number
          unit_price: number
          subtotal: number
          is_gift?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          color_id?: string | null
          quantity?: number
          unit_price?: number
          subtotal?: number
          is_gift?: boolean
          created_at?: string
        }
      }
      seasonal_layouts: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          theme_colors: Json
          is_active: boolean
          scheduled_start: string | null
          scheduled_end: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          theme_colors?: Json
          is_active?: boolean
          scheduled_start?: string | null
          scheduled_end?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          theme_colors?: Json
          is_active?: boolean
          scheduled_start?: string | null
          scheduled_end?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      landing_sections: {
        Row: {
          id: string
          layout_id: string | null
          section_type: 'hero' | 'timer' | 'featured_products' | 'gifts' | 'social_proof' | 'about' | 'last_call' | 'faq' | 'custom'
          title: string | null
          content: Json
          images: string[]
          videos: string[]
          cta_config: Json
          order_position: number
          is_visible: boolean
          background_color: string | null
          text_color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          layout_id?: string | null
          section_type: 'hero' | 'timer' | 'featured_products' | 'gifts' | 'social_proof' | 'about' | 'last_call' | 'faq' | 'custom'
          title?: string | null
          content?: Json
          images?: string[]
          videos?: string[]
          cta_config?: Json
          order_position?: number
          is_visible?: boolean
          background_color?: string | null
          text_color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          layout_id?: string | null
          section_type?: 'hero' | 'timer' | 'featured_products' | 'gifts' | 'social_proof' | 'about' | 'last_call' | 'faq' | 'custom'
          title?: string | null
          content?: Json
          images?: string[]
          videos?: string[]
          cta_config?: Json
          order_position?: number
          is_visible?: boolean
          background_color?: string | null
          text_color?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      timers: {
        Row: {
          id: string
          section_id: string | null
          name: string
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          section_id?: string | null
          name: string
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          section_id?: string | null
          name?: string
          start_date?: string
          end_date?: string
          is_active?: boolean
          created_at?: string
        }
      }
      faqs: {
        Row: {
          id: string
          question: string
          answer: string
          order_position: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question: string
          answer: string
          order_position?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question?: string
          answer?: string
          order_position?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      site_settings: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          description?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          description?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

