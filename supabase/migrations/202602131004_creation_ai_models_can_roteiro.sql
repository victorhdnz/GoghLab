-- Separa atribuição: Vídeo (gera vídeo) vs Roteiro de Vídeos (gera texto/roteiro).
-- can_video = aparece na aba Vídeo (gera vídeo)
-- can_roteiro = aparece na aba Roteiro de Vídeos (gera texto/roteiro)
-- can_prompt = aparece na aba Criação de prompts (gera texto/prompts)

ALTER TABLE public.creation_ai_models
  ADD COLUMN IF NOT EXISTS can_roteiro BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.creation_ai_models.can_roteiro IS 'Exibir na aba Roteiro de Vídeos (gera texto/roteiro). Diferente de can_video (gera vídeo) e can_prompt (Criação de prompts).';

-- Modelos que hoje têm can_prompt e são de texto: marcar can_roteiro também para aparecer em Roteiro de Vídeos.
-- Assim quem já usa para "roteiro e prompts" continua em ambas as abas; depois o admin pode desmarcar se quiser só em uma.
UPDATE public.creation_ai_models
SET can_roteiro = true
WHERE can_prompt = true AND (model_key IS NULL OR model_key NOT LIKE 'openai/gpt-image%');
