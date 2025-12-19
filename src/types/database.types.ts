// Tipos TypeScript gerados do schema do Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
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
          avatar_url?: string | null
          role?: 'customer' | 'editor' | 'admin'
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

