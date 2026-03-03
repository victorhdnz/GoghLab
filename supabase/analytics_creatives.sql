-- ==========================================
-- Tabela analytics_creatives (criativos por campanha - estilo Meta Ads)
-- ==========================================
-- Cada campanha pode ter vários criativos. Métricas por criativo para decisões
-- granulares (ex.: "Trocar o criativo X", escalar o que performa).
-- ==========================================

CREATE TABLE IF NOT EXISTS public.analytics_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.analytics_campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'Criativo',
  alcance BIGINT,
  impressoes BIGINT,
  cliques_link INTEGER,
  valor_investido DECIMAL(12,2),
  compras INTEGER,
  valor_total_faturado DECIMAL(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_creatives_campaign_id ON public.analytics_creatives(campaign_id);

COMMENT ON TABLE public.analytics_creatives IS 'Criativos de anúncio por campanha (métricas por criativo para análise e decisões).';

ALTER TABLE public.analytics_creatives ENABLE ROW LEVEL SECURITY;

-- Acesso via campanha do usuário (SELECT/INSERT/UPDATE/DELETE só nos criativos das próprias campanhas)
DROP POLICY IF EXISTS "Users can view creatives of own campaigns" ON public.analytics_creatives;
CREATE POLICY "Users can view creatives of own campaigns" ON public.analytics_creatives
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.analytics_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert creatives in own campaigns" ON public.analytics_creatives;
CREATE POLICY "Users can insert creatives in own campaigns" ON public.analytics_creatives
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.analytics_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update creatives in own campaigns" ON public.analytics_creatives;
CREATE POLICY "Users can update creatives in own campaigns" ON public.analytics_creatives
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.analytics_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete creatives in own campaigns" ON public.analytics_creatives;
CREATE POLICY "Users can delete creatives in own campaigns" ON public.analytics_creatives
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.analytics_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid())
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_analytics_creatives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_analytics_creatives_updated_at ON public.analytics_creatives;
CREATE TRIGGER set_analytics_creatives_updated_at
  BEFORE UPDATE ON public.analytics_creatives
  FOR EACH ROW EXECUTE FUNCTION public.set_analytics_creatives_updated_at();
