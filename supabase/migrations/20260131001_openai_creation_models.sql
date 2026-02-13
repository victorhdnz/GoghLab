-- Coluna opcional para o backend saber qual API/modelo chamar (ex.: openai/gpt-image-1).
ALTER TABLE public.creation_ai_models
  ADD COLUMN IF NOT EXISTS model_key TEXT;

COMMENT ON COLUMN public.creation_ai_models.model_key IS 'Identificador do modelo na API (ex.: openai/gpt-image-1). Usado pela API de geração.';

-- Inserir modelos OpenAI (só se ainda não existir nenhum com model_key openai).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.creation_ai_models WHERE model_key LIKE 'openai/%') THEN
    INSERT INTO public.creation_ai_models (name, logo_url, can_image, can_video, can_prompt, order_position, model_key) VALUES
      ('OpenAI GPT Image 1.5', NULL, true, false, false, 30, 'openai/gpt-image-1.5'),
      ('OpenAI GPT Image 1', NULL, true, false, false, 31, 'openai/gpt-image-1'),
      ('OpenAI DALL·E 3', NULL, true, false, false, 32, 'openai/dall-e-3'),
      ('OpenAI Sora 2', NULL, false, true, false, 40, 'openai/sora-2'),
      ('OpenAI Sora 2 Pro', NULL, false, true, false, 41, 'openai/sora-2-pro'),
      ('OpenAI GPT-5 (texto/roteiro)', NULL, false, false, true, 50, 'openai/gpt-5'),
      ('OpenAI GPT-4.1 (texto)', NULL, false, false, true, 51, 'openai/gpt-4.1');
  END IF;
END $$;
