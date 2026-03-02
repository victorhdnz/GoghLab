-- ==========================================
-- Tabela analytics_campaigns (campanhas do Gogh Analytics)
-- ==========================================
-- Cada campanha tem: nome, data de início, ativa, e opcionalmente valores para ROI.
-- O cliente pode criar, ativar, desativar e excluir; ao selecionar uma campanha,
-- os filtros e a seção de custos/ROI espelham os dados dela.
-- ==========================================

CREATE TABLE IF NOT EXISTS public.analytics_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Opcionais para ROI / decisão (podem ser null)
  valor_venda DECIMAL(12,2),
  custo_venda DECIMAL(12,2),
  custo_por_aquisicao DECIMAL(12,2),
  roi_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_campaigns_user_id ON public.analytics_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_campaigns_start_date ON public.analytics_campaigns(start_date);
CREATE INDEX IF NOT EXISTS idx_analytics_campaigns_is_active ON public.analytics_campaigns(is_active);

COMMENT ON TABLE public.analytics_campaigns IS 'Campanhas do cliente no Gogh Analytics (tráfego pago); cada uma pode ter data de início e métricas de custo/receita opcionais.';

ALTER TABLE public.analytics_campaigns ENABLE ROW LEVEL SECURITY;

-- Usuário vê e gerencia apenas as próprias campanhas
DROP POLICY IF EXISTS "Users can view own analytics campaigns" ON public.analytics_campaigns;
CREATE POLICY "Users can view own analytics campaigns" ON public.analytics_campaigns
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analytics campaigns" ON public.analytics_campaigns;
CREATE POLICY "Users can insert own analytics campaigns" ON public.analytics_campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own analytics campaigns" ON public.analytics_campaigns;
CREATE POLICY "Users can update own analytics campaigns" ON public.analytics_campaigns
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own analytics campaigns" ON public.analytics_campaigns;
CREATE POLICY "Users can delete own analytics campaigns" ON public.analytics_campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_analytics_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_analytics_campaigns_updated_at ON public.analytics_campaigns;
CREATE TRIGGER set_analytics_campaigns_updated_at
  BEFORE UPDATE ON public.analytics_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_analytics_campaigns_updated_at();
