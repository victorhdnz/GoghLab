-- Custo em créditos por uso de cada modelo de IA (opcional; quando null, usa custo padrão da função).
ALTER TABLE public.creation_ai_models
  ADD COLUMN IF NOT EXISTS credit_cost INTEGER;

COMMENT ON COLUMN public.creation_ai_models.credit_cost IS 'Créditos descontados por geração com este modelo; null = usar custo padrão da função (Foto/Vídeo/Roteiro/Prompts).';
