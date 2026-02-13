-- Inserir modelos xAI (Grok) para criação (texto, imagem, vídeo).
-- Requer XAI_API_KEY no ambiente. model_key no formato xai/<id>.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.creation_ai_models WHERE model_key LIKE 'xai/%') THEN
    INSERT INTO public.creation_ai_models (name, logo_url, can_image, can_video, can_prompt, order_position, model_key, credit_cost) VALUES
      ('Grok (texto/roteiro)', NULL, false, false, true, 60, 'xai/grok-4-latest', NULL),
      ('Grok Imagine (imagem)', NULL, true, false, false, 61, 'xai/grok-imagine-image', NULL),
      ('Grok Imagine (vídeo)', NULL, false, true, false, 62, 'xai/grok-imagine-video', NULL);
  END IF;
END $$;
