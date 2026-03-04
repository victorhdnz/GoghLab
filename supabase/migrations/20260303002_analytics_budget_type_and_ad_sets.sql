-- budget_type_meta na campanha: define estrutura CBO (criativos direto) ou ABO (conjuntos + criativos)
ALTER TABLE public.analytics_campaigns
  ADD COLUMN IF NOT EXISTS budget_type_meta TEXT NOT NULL DEFAULT 'cbo'
  CHECK (budget_type_meta IN ('cbo', 'abo'));

COMMENT ON COLUMN public.analytics_campaigns.budget_type_meta IS 'CBO = orçamento na campanha (criativos direto); ABO = orçamento no conjunto (conjuntos de anúncios + criativos)';

-- Conjuntos de anúncios (usados apenas para campanhas ABO)
CREATE TABLE IF NOT EXISTS public.analytics_ad_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.analytics_campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'Conjunto 1',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_ad_sets_campaign_id ON public.analytics_ad_sets(campaign_id);

COMMENT ON TABLE public.analytics_ad_sets IS 'Conjuntos de anúncios por campanha (ABO). Em CBO não são usados.';

ALTER TABLE public.analytics_ad_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view ad sets of own campaigns" ON public.analytics_ad_sets;
CREATE POLICY "Users can view ad sets of own campaigns" ON public.analytics_ad_sets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.analytics_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert ad sets in own campaigns" ON public.analytics_ad_sets;
CREATE POLICY "Users can insert ad sets in own campaigns" ON public.analytics_ad_sets
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.analytics_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update ad sets of own campaigns" ON public.analytics_ad_sets;
CREATE POLICY "Users can update ad sets of own campaigns" ON public.analytics_ad_sets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.analytics_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete ad sets of own campaigns" ON public.analytics_ad_sets;
CREATE POLICY "Users can delete ad sets of own campaigns" ON public.analytics_ad_sets
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.analytics_campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid())
  );

-- Trigger updated_at para ad_sets
CREATE OR REPLACE FUNCTION public.set_analytics_ad_sets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_analytics_ad_sets_updated_at ON public.analytics_ad_sets;
CREATE TRIGGER set_analytics_ad_sets_updated_at
  BEFORE UPDATE ON public.analytics_ad_sets
  FOR EACH ROW EXECUTE FUNCTION public.set_analytics_ad_sets_updated_at();

-- Criativos podem pertencer a um conjunto (ABO) ou direto à campanha (CBO → ad_set_id null)
ALTER TABLE public.analytics_creatives
  ADD COLUMN IF NOT EXISTS ad_set_id UUID REFERENCES public.analytics_ad_sets(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_analytics_creatives_ad_set_id ON public.analytics_creatives(ad_set_id);

COMMENT ON COLUMN public.analytics_creatives.ad_set_id IS 'Conjunto de anúncios (ABO). Null = criativo direto na campanha (CBO).';

-- RLS de creatives já valida via campaign_id; para ad_set_id precisamos garantir que o ad_set pertence a campanha do user (já garantido por campaign_id no creative).
