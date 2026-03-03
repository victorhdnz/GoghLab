-- ==========================================
-- Novos campos para Sistema Inteligente de Decisão de Campanhas
-- Execute no SQL Editor do Supabase (tabela analytics_campaigns já deve existir)
-- ==========================================

-- Dados da campanha (inserção manual pelo cliente)
ALTER TABLE public.analytics_campaigns
  ADD COLUMN IF NOT EXISTS alcance BIGINT,
  ADD COLUMN IF NOT EXISTS impressoes BIGINT,
  ADD COLUMN IF NOT EXISTS cliques_link INTEGER,
  ADD COLUMN IF NOT EXISTS valor_investido DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS compras INTEGER,
  ADD COLUMN IF NOT EXISTS valor_total_faturado DECIMAL(12,2);

-- Estrutura financeira: meta de lucro por venda (opcional)
ALTER TABLE public.analytics_campaigns
  ADD COLUMN IF NOT EXISTS meta_lucro_por_venda DECIMAL(12,2);

COMMENT ON COLUMN public.analytics_campaigns.alcance IS 'Alcance único da campanha (pessoas que viram)';
COMMENT ON COLUMN public.analytics_campaigns.impressoes IS 'Total de impressões';
COMMENT ON COLUMN public.analytics_campaigns.cliques_link IS 'Cliques no link';
COMMENT ON COLUMN public.analytics_campaigns.valor_investido IS 'Valor investido em anúncios (R$)';
COMMENT ON COLUMN public.analytics_campaigns.compras IS 'Número de compras/conversões';
COMMENT ON COLUMN public.analytics_campaigns.valor_total_faturado IS 'Receita gerada (R$)';
COMMENT ON COLUMN public.analytics_campaigns.meta_lucro_por_venda IS 'Meta de lucro desejada por venda (R$)';
