/**
 * Tipos TypeScript para Gogh Lab - Sistema de Assinaturas e Agentes de IA
 */

// ==========================================
// SUBSCRIPTIONS (Assinaturas)
// ==========================================

export type SubscriptionPlanType = 'essential' | 'premium'

export type SubscriptionStatus = 
  | 'active' 
  | 'canceled' 
  | 'past_due' 
  | 'trialing' 
  | 'incomplete' 
  | 'incomplete_expired' 
  | 'unpaid'

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan_type: SubscriptionPlanType
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  created_at: string
  updated_at: string
}

// ==========================================
// SUBSCRIPTION BENEFITS (Benefícios)
// ==========================================

export type BenefitType = 'canva_pro' | 'capcut_pro'

export type BenefitStatus = 'pending' | 'delivered' | 'active' | 'expired'

export interface SubscriptionBenefit {
  id: string
  subscription_id: string
  benefit_type: BenefitType
  access_url: string | null
  access_credentials: Record<string, any> | null
  status: BenefitStatus
  delivered_at: string | null
  delivered_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ==========================================
// COURSES (Cursos)
// ==========================================

export type CourseType = 'canva' | 'capcut' | 'strategy' | 'other'

export interface CourseModule {
  id: string
  title: string
  description: string
  video_url: string
  duration: number // em segundos
  order: number
}

export interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  course_type: CourseType
  modules: CourseModule[]
  is_premium_only: boolean
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

// ==========================================
// COURSE PROGRESS (Progresso)
// ==========================================

export interface CourseProgress {
  id: string
  user_id: string
  course_id: string
  module_id: string
  completed: boolean
  progress_percentage: number // 0-100
  time_watched: number // em segundos
  last_accessed: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

// ==========================================
// AGENT CONVERSATIONS (Conversas com Agentes)
// ==========================================

export type AgentType = 'video' | 'social' | 'ads'

export type MessageRole = 'user' | 'assistant'

export interface MessageAttachment {
  type: 'image' | 'document' | 'video'
  url: string
  name?: string
  size?: number
}

export interface AgentMessage {
  role: MessageRole
  content: string
  timestamp: string
  attachments?: MessageAttachment[]
}

export interface AgentConversation {
  id: string
  user_id: string
  agent_type: AgentType
  title: string | null
  messages: AgentMessage[]
  metadata: Record<string, any>
  is_archived: boolean
  created_at: string
  updated_at: string
}

// ==========================================
// HELPERS
// ==========================================

export interface UserSubscriptionInfo {
  hasActiveSubscription: boolean
  hasPremiumPlan: boolean
  subscription: Subscription | null
  benefits: SubscriptionBenefit[]
}

export interface CourseWithProgress extends Course {
  progress?: CourseProgress[]
  overallProgress?: number // 0-100
}

