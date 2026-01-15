-- ==========================================
-- SCHEMA GOGH LAB - Sistema de Assinaturas e Agentes de IA
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- SUBSCRIPTIONS (Assinaturas)
-- ==========================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('essential', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON subscriptions(plan_type);

-- Comentários
COMMENT ON TABLE subscriptions IS 'Tabela de assinaturas dos usuários (Stripe)';
COMMENT ON COLUMN subscriptions.plan_type IS 'Tipo de plano: essential ou premium';
COMMENT ON COLUMN subscriptions.status IS 'Status da assinatura no Stripe';

-- ==========================================
-- SUBSCRIPTION BENEFITS (Benefícios Entregues - Canva/CapCut)
-- ==========================================
CREATE TABLE IF NOT EXISTS subscription_benefits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE NOT NULL,
  benefit_type TEXT NOT NULL CHECK (benefit_type IN ('canva_pro', 'capcut_pro')),
  access_url TEXT, -- Link de acesso fornecido
  access_credentials JSONB DEFAULT '{}', -- {username, password} ou outros dados necessários
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'active', 'expired')),
  delivered_at TIMESTAMP WITH TIME ZONE,
  delivered_by UUID REFERENCES auth.users, -- Admin que entregou o acesso
  notes TEXT, -- Notas adicionais
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscription_benefits_subscription_id ON subscription_benefits(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_benefits_status ON subscription_benefits(status);
CREATE INDEX IF NOT EXISTS idx_subscription_benefits_benefit_type ON subscription_benefits(benefit_type);

-- Comentários
COMMENT ON TABLE subscription_benefits IS 'Benefícios entregues aos assinantes (Canva Pro, CapCut Pro)';
COMMENT ON COLUMN subscription_benefits.benefit_type IS 'Tipo de benefício: canva_pro ou capcut_pro';
COMMENT ON COLUMN subscription_benefits.status IS 'Status: pending (aguardando), delivered (entregue), active (ativo), expired (expirado)';

-- ==========================================
-- COURSES (Cursos Educacionais)
-- ==========================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  course_type TEXT NOT NULL CHECK (course_type IN ('canva', 'capcut', 'strategy', 'other')),
  modules JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de módulos com {id, title, description, video_url, duration, order}
  is_premium_only BOOLEAN DEFAULT true, -- Se true, apenas plano Premium tem acesso
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0, -- Ordem de exibição
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_course_type ON courses(course_type);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_order_index ON courses(order_index);

-- Comentários
COMMENT ON TABLE courses IS 'Cursos educacionais da plataforma (Canva, CapCut, Estratégias)';
COMMENT ON COLUMN courses.modules IS 'Array de módulos em formato JSON: [{id, title, description, video_url, duration, order}]';

-- ==========================================
-- COURSE PROGRESS (Progresso do Usuário nos Cursos)
-- ==========================================
CREATE TABLE IF NOT EXISTS course_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  module_id TEXT NOT NULL, -- ID do módulo dentro do curso
  completed BOOLEAN DEFAULT false,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  time_watched INTEGER DEFAULT 0, -- Tempo assistido em segundos
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id, module_id) -- Um registro por módulo por usuário
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_course_progress_user_id ON course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_course_id ON course_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_completed ON course_progress(completed);

-- Comentários
COMMENT ON TABLE course_progress IS 'Progresso dos usuários nos cursos';
COMMENT ON COLUMN course_progress.module_id IS 'ID do módulo dentro do curso (referência ao JSON modules)';

-- ==========================================
-- AGENT CONVERSATIONS (Conversas com Agentes de IA)
-- ==========================================
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('video', 'social', 'ads')),
  title TEXT, -- Título da conversa (gerado automaticamente ou pelo usuário)
  messages JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de mensagens: [{role: 'user'|'assistant', content, timestamp, attachments?}]
  metadata JSONB DEFAULT '{}', -- Metadados adicionais (contexto, configurações, etc)
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_agent_conversations_user_id ON agent_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_agent_type ON agent_conversations(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_is_archived ON agent_conversations(is_archived);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_created_at ON agent_conversations(created_at DESC);

-- Comentários
COMMENT ON TABLE agent_conversations IS 'Conversas dos usuários com os agentes de IA';
COMMENT ON COLUMN agent_conversations.agent_type IS 'Tipo de agente: video (conteúdo em vídeo), social (redes sociais), ads (anúncios)';
COMMENT ON COLUMN agent_conversations.messages IS 'Array de mensagens em formato JSON: [{role, content, timestamp, attachments?}]';

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- SUBSCRIPTIONS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias assinaturas
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Apenas admins podem ver todas as assinaturas
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Política: Sistema pode inserir/atualizar assinaturas (via webhook Stripe)
DROP POLICY IF EXISTS "System can manage subscriptions" ON subscriptions;
CREATE POLICY "System can manage subscriptions"
  ON subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- SUBSCRIPTION BENEFITS
ALTER TABLE subscription_benefits ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver benefícios de suas assinaturas
DROP POLICY IF EXISTS "Users can view their subscription benefits" ON subscription_benefits;
CREATE POLICY "Users can view their subscription benefits"
  ON subscription_benefits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM subscriptions 
      WHERE subscriptions.id = subscription_benefits.subscription_id 
      AND subscriptions.user_id = auth.uid()
    )
  );

-- Política: Admins podem gerenciar todos os benefícios
DROP POLICY IF EXISTS "Admins can manage all benefits" ON subscription_benefits;
CREATE POLICY "Admins can manage all benefits"
  ON subscription_benefits
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- COURSES
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ver cursos ativos
DROP POLICY IF EXISTS "Everyone can view active courses" ON courses;
CREATE POLICY "Everyone can view active courses"
  ON courses
  FOR SELECT
  USING (is_active = true);

-- Política: Apenas admins podem gerenciar cursos
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
CREATE POLICY "Admins can manage courses"
  ON courses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- COURSE PROGRESS
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver e gerenciar apenas seu próprio progresso
DROP POLICY IF EXISTS "Users can manage their own course progress" ON course_progress;
CREATE POLICY "Users can manage their own course progress"
  ON course_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Admins podem ver todo o progresso
DROP POLICY IF EXISTS "Admins can view all course progress" ON course_progress;
CREATE POLICY "Admins can view all course progress"
  ON course_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- AGENT CONVERSATIONS
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver e gerenciar apenas suas próprias conversas
DROP POLICY IF EXISTS "Users can manage their own conversations" ON agent_conversations;
CREATE POLICY "Users can manage their own conversations"
  ON agent_conversations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Admins podem ver todas as conversas (para suporte)
DROP POLICY IF EXISTS "Admins can view all conversations" ON agent_conversations;
CREATE POLICY "Admins can view all conversations"
  ON agent_conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- ==========================================
-- FUNÇÕES ÚTEIS
-- ==========================================

-- Função para verificar se usuário tem assinatura ativa
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM subscriptions 
    WHERE user_id = p_user_id 
    AND status = 'active'
    AND current_period_end > NOW()
  );
END;
$$;

-- Função para verificar se usuário tem plano Premium
CREATE OR REPLACE FUNCTION has_premium_plan(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM subscriptions 
    WHERE user_id = p_user_id 
    AND plan_type = 'premium'
    AND status = 'active'
    AND current_period_end > NOW()
  );
END;
$$;

-- Função para obter assinatura ativa do usuário
CREATE OR REPLACE FUNCTION get_active_subscription(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  plan_type TEXT,
  status TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.plan_type,
    s.status,
    s.current_period_end
  FROM subscriptions s
  WHERE s.user_id = p_user_id 
  AND s.status = 'active'
  AND s.current_period_end > NOW()
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- Dar permissões para as funções
GRANT EXECUTE ON FUNCTION has_active_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_premium_plan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_subscription(UUID) TO authenticated;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_benefits_updated_at
  BEFORE UPDATE ON subscription_benefits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_progress_updated_at
  BEFORE UPDATE ON course_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_conversations_updated_at
  BEFORE UPDATE ON agent_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- VERIFICAÇÃO FINAL
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE 'Schema Gogh Lab criado com sucesso!';
  RAISE NOTICE 'Tabelas criadas: subscriptions, subscription_benefits, courses, course_progress, agent_conversations';
  RAISE NOTICE 'RLS habilitado em todas as tabelas';
  RAISE NOTICE 'Funções e triggers criados';
END $$;

