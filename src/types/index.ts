// Tipos principais da aplicação

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  price: number
  product_code: string | null
  ecommerce_url?: string | null // URL do produto no e-commerce externo
  is_featured: boolean
  is_active: boolean
  weight: number | null
  width: number | null
  height: number | null
  length: number | null
  category: string | null
  tags: string[] | null
  specifications?: Array<{ key: string; value: string }>
  benefits?: {
    free_shipping?: { enabled: boolean; text: string }
    warranty?: { enabled: boolean; text: string }
    returns?: { enabled: boolean; text: string }
    gift?: { enabled: boolean; text: string }
  }
  colors?: ProductColor[]
  gifts?: Product[]
  images?: string[]
  created_at: string
  updated_at: string
}

export interface ProductColor {
  id: string
  product_id: string
  color_name: string
  color_hex: string
  images: string[]
  stock: number
  is_active: boolean
}

export interface CartItem {
  product: Product
  color?: ProductColor
  quantity: number
  is_gift: boolean
  parent_product_id?: string
}

export interface User {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: 'customer' | 'editor' | 'admin'
}

export interface Address {
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
}

export interface Order {
  id: string
  order_number: string
  user_id: string
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  subtotal: number
  shipping_cost: number
  total: number
  payment_method: string | null
  payment_status: string
  shipping_address: Address
  tracking_code: string | null
  items: OrderItem[]
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product: Product
  color?: ProductColor
  quantity: number
  unit_price: number
  subtotal: number
  is_gift: boolean
}

export interface Review {
  id: string
  product_id: string
  user_id: string | null
  customer_name: string
  rating: number
  comment: string
  is_approved: boolean
  created_at: string
}

export interface FAQ {
  id: string
  question: string
  answer: string
  order_position: number
  is_active: boolean
}

export interface SeasonalLayout {
  id: string
  name: string
  slug: string
  description: string | null
  theme_colors: {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
  }
  is_active: boolean
  scheduled_start: string | null
  scheduled_end: string | null
  sections?: LandingSection[]
}

export interface LandingSection {
  id: string
  layout_id: string | null
  section_type: 'hero' | 'timer' | 'featured_products' | 'gifts' | 'social_proof' | 'about' | 'last_call' | 'faq' | 'custom'
  title: string | null
  content: Record<string, any>
  images: string[]
  videos: string[]
  cta_config: {
    text?: string
    link?: string
    type?: 'whatsapp' | 'checkout' | 'external'
  }
  order_position: number
  is_visible: boolean
  background_color: string | null
  text_color: string | null
}

export interface Timer {
  id: string
  section_id: string | null
  name: string
  start_date: string
  end_date: string
  is_active: boolean
}

export interface ShippingCalculation {
  cep: string
  city: string
  price: number
  days: number
  method: 'local' | 'national'
}

export interface SiteSettings {
  site_name: string
  primary_color: string
  secondary_color: string
  accent_color: string
  frete_uberlandia: number
  cep_uberlandia: string
  whatsapp_number: string
  email_contact: string
  instagram_url: string
  facebook_url: string
}

// ==========================================
// NOVOS TIPOS PARA LANDING PAGES
// ==========================================

export interface LandingLayout {
  id: string
  name: string
  slug: string
  description: string | null
  custom_url: string | null
  theme_colors: {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
    text?: string
    button?: string
    buttonText?: string
  }
  default_fonts: {
    heading?: string
    body?: string
    button?: string
  }
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  versions?: LandingVersion[]
}

export interface LandingVersion {
  id: string
  layout_id: string
  name: string
  slug: string
  description: string | null
  version_number: number
  is_active: boolean
  is_default: boolean
  custom_styles: {
    fonts?: {
      heading?: string
      body?: string
      button?: string
    }
    colors?: {
      primary?: string
      secondary?: string
      accent?: string
      background?: string
      text?: string
      button?: string
      buttonText?: string
    }
  }
  sections_config: Record<string, any>
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface LandingAnalytics {
  id: string
  layout_id: string | null
  version_id: string | null
  session_id: string
  event_type: 'page_view' | 'click' | 'scroll' | 'time_on_page' | 'exit' | 'conversion'
  event_data: {
    element?: string
    scroll_depth?: number
    time_seconds?: number
    url?: string
    [key: string]: any
  }
  user_agent: string | null
  referrer: string | null
  ip_address: string | null
  created_at: string
}

export interface ProductComparison {
  id: string
  product_id: string
  comparison_topics: Array<{
    topic: string
    value: string
    icon?: string
  }>
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  product?: Product
}

export interface ProductSupportPage {
  id: string
  product_id: string
  model_slug: string
  title: string
  content: {
    sections?: Array<{
      id: string
      type: 'hero' | 'text' | 'image' | 'video' | 'list' | 'accordion' | 'feature-card' | 'steps'
      title?: string
      subtitle?: string
      content?: string
      image?: string
      video?: string
      link?: string
      linkText?: string
      items?: Array<{ 
        title: string
        description: string
        image?: string
        link?: string
        detailed_content?: {
          full_description?: string
          additional_images?: string[]
          steps?: Array<{ title: string; description: string; image?: string }>
        }
      }>
    }>
  }
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  product?: Product
}

// ==========================================
// TIPOS PARA CATÁLOGOS DE PRODUTOS
// ==========================================

export interface ProductCatalog {
  id: string
  slug: string
  title: string
  description: string | null
  cover_image: string | null
  theme_colors: {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
    text?: string
  }
  content: {
    hero?: {
      title: string
      subtitle: string
      image?: string
      badge?: string
    }
    categories?: Array<{
      id: string
      name: string
      description?: string
      image?: string
      products: string[] // IDs dos produtos
    }>
    featured_products?: string[] // IDs dos produtos em destaque
    sections?: Array<{
      id: string
      type: 'banner' | 'grid' | 'carousel' | 'comparison'
      title?: string
      products?: string[]
      image?: string
      link?: string
    }>
  }
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

