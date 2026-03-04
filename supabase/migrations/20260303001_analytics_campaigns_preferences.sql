-- Sincronizar preferências do Analytics entre dispositivos (perfil de análise e "como você está")
ALTER TABLE public.analytics_campaigns
  ADD COLUMN IF NOT EXISTS has_existing_ads BOOLEAN,
  ADD COLUMN IF NOT EXISTS analytics_profile TEXT;

COMMENT ON COLUMN public.analytics_campaigns.has_existing_ads IS 'true = já tem anúncio/campanha, false = criar do zero, null = não respondeu';
COMMENT ON COLUMN public.analytics_campaigns.analytics_profile IS 'Perfil de análise: venda-site | contato-mensagens | leads';
