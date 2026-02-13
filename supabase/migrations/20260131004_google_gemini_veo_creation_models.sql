-- Inserir modelos Google (Gemini / Veo) para criação: imagem, vídeo, texto.
-- Requer GEMINI_API_KEY no ambiente. model_key no formato google/<id>.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.creation_ai_models WHERE model_key LIKE 'google/%') THEN
    INSERT INTO public.creation_ai_models (name, logo_url, can_image, can_video, can_prompt, order_position, model_key, credit_cost) VALUES
      ('Gemini (imagem)', NULL, true, false, false, 70, 'google/gemini-2.5-flash-image', NULL),
      ('Gemini Pro (imagem)', NULL, true, false, false, 71, 'google/gemini-3-pro-image-preview', NULL),
      ('Veo 3.1 (vídeo)', NULL, false, true, false, 72, 'google/veo-3.1-generate-preview', NULL),
      ('Gemini (texto/roteiro)', NULL, false, false, true, 73, 'google/gemini-2.5-flash', NULL),
      ('Gemini 3 Flash (texto)', NULL, false, false, true, 74, 'google/gemini-3-flash-preview', NULL);
  END IF;
END $$;
