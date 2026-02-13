-- Remover modelos de IA genéricos/placeholder e recriar com nomes corretos.
DELETE FROM public.creation_ai_models
WHERE name IN (
  'Gemini Nano Banana (imagem)',
  'Gemini Nano Banana Pro (imagem)'
);

-- Reinserir os modelos Google de imagem com nomes corretos (mesmo model_key, para não perder a opção).
INSERT INTO public.creation_ai_models (name, logo_url, can_image, can_video, can_prompt, order_position, model_key, credit_cost)
SELECT 'Gemini (imagem)', NULL, true, false, false, 70, 'google/gemini-2.5-flash-image', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.creation_ai_models WHERE model_key = 'google/gemini-2.5-flash-image');
INSERT INTO public.creation_ai_models (name, logo_url, can_image, can_video, can_prompt, order_position, model_key, credit_cost)
SELECT 'Gemini Pro (imagem)', NULL, true, false, false, 71, 'google/gemini-3-pro-image-preview', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.creation_ai_models WHERE model_key = 'google/gemini-3-pro-image-preview');
