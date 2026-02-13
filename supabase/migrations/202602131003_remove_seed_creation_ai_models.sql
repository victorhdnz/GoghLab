-- Remove os modelos de IA do seed que não são usados (Padrão, DALL·E, Flux, Runway, Pika).
-- Os modelos que vocês usam (OpenAI, Grok, Veo, Gemini etc.) vêm de outras migrations e permanecem.

DELETE FROM public.creation_ai_models
WHERE name IN (
  'Padrão (imagem)',
  'DALL·E',
  'Flux',
  'Padrão (vídeo)',
  'Runway',
  'Pika',
  'Padrão (prompt)'
);
