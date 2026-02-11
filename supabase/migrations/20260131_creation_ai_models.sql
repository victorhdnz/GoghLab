-- Modelos de IA para a página Criar (foto, vídeo, roteiro, prompts).
-- Cada modelo tem capacidades (can_image, can_video, can_prompt) para filtrar por aba.
-- Logo opcional (logo_url); sem logo usa ícone padrão no chat.

CREATE TABLE IF NOT EXISTS public.creation_ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  can_image BOOLEAN DEFAULT false,
  can_video BOOLEAN DEFAULT false,
  can_prompt BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.creation_ai_models IS 'Modelos de IA exibidos no seletor da página Criar (por aba: foto, vídeo, vangogh)';

CREATE INDEX IF NOT EXISTS idx_creation_ai_models_active_order
  ON public.creation_ai_models (is_active, order_position)
  WHERE is_active = true;

-- Leitura pública (chat); escrita apenas admin via RLS.
ALTER TABLE public.creation_ai_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "creation_ai_models_select_public" ON public.creation_ai_models;
CREATE POLICY "creation_ai_models_select_public" ON public.creation_ai_models
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "creation_ai_models_admin_all" ON public.creation_ai_models;
CREATE POLICY "creation_ai_models_admin_all" ON public.creation_ai_models
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Seed: modelos padrão (espelham comportamento atual por aba)
INSERT INTO public.creation_ai_models (name, logo_url, can_image, can_video, can_prompt, order_position) VALUES
  ('Padrão (imagem)', NULL, true, false, false, 1),
  ('DALL·E', NULL, true, false, true, 2),
  ('Flux', NULL, true, false, true, 3),
  ('Padrão (vídeo)', NULL, false, true, false, 10),
  ('Runway', NULL, false, true, false, 11),
  ('Pika', NULL, false, true, false, 12),
  ('Padrão (prompt)', NULL, false, false, true, 20)
;
