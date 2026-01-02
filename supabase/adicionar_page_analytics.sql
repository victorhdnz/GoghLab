-- ==========================================
-- MIGRAÇÃO: Criar tabela page_analytics
-- Execute este script no SQL Editor do Supabase
-- Data: 2024
-- ==========================================

-- Criar tabela page_analytics
CREATE TABLE IF NOT EXISTS page_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_type VARCHAR(50) NOT NULL, -- 'homepage' | 'service' | 'product'
  page_id UUID, -- ID do serviço/produto (NULL para homepage)
  page_slug VARCHAR(255), -- Slug da página
  session_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'page_view' | 'click' | 'scroll' | 'time_on_page' | 'exit' | 'conversion'
  event_data JSONB DEFAULT '{}', -- Dados do evento (scroll_depth, element, time_seconds, etc)
  user_agent TEXT,
  referrer TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_page_analytics_page_type ON page_analytics(page_type);
CREATE INDEX IF NOT EXISTS idx_page_analytics_page_id ON page_analytics(page_id);
CREATE INDEX IF NOT EXISTS idx_page_analytics_session_id ON page_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_page_analytics_event_type ON page_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_page_analytics_created_at ON page_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_page_analytics_page_slug ON page_analytics(page_slug);

-- Comentários
COMMENT ON TABLE page_analytics IS 'Tabela para armazenar eventos de analytics (views, cliques, scroll, tempo na página, etc)';
COMMENT ON COLUMN page_analytics.page_type IS 'Tipo da página: homepage, service ou product';
COMMENT ON COLUMN page_analytics.page_id IS 'ID do serviço/produto (NULL para homepage)';
COMMENT ON COLUMN page_analytics.page_slug IS 'Slug da página para identificação';
COMMENT ON COLUMN page_analytics.session_id IS 'ID único da sessão do usuário';
COMMENT ON COLUMN page_analytics.event_type IS 'Tipo do evento: page_view, click, scroll, time_on_page, exit, conversion';
COMMENT ON COLUMN page_analytics.event_data IS 'Dados adicionais do evento em formato JSON';

-- Habilitar RLS
ALTER TABLE page_analytics ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode inserir eventos de analytics
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON page_analytics;
CREATE POLICY "Anyone can insert analytics events" ON page_analytics
  FOR INSERT
  WITH CHECK (true);

-- Política: Apenas admins e editors podem visualizar analytics
DROP POLICY IF EXISTS "Admins and editors can view analytics" ON page_analytics;
CREATE POLICY "Admins and editors can view analytics" ON page_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Política: Apenas admins e editors podem deletar analytics
DROP POLICY IF EXISTS "Admins and editors can delete analytics" ON page_analytics;
CREATE POLICY "Admins and editors can delete analytics" ON page_analytics
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Verificar se foi criado corretamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'page_analytics'
  ) THEN
    RAISE NOTICE 'Tabela page_analytics criada com sucesso!';
  ELSE
    RAISE EXCEPTION 'Erro ao criar tabela page_analytics';
  END IF;
END $$;

