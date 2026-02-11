-- ==========================================
-- Fix RLS: course_lessons, plan_features, ai_agents, course_modules
-- Resolve erros do Supabase Linter:
-- - policy_exists_rls_disabled (course_lessons tem políticas mas RLS estava desativado)
-- - rls_disabled_in_public (plan_features, ai_agents, course_modules, course_lessons)
-- ==========================================

-- 1. course_lessons: só habilitar RLS (as políticas já existem)
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

-- 2. plan_features: habilitar RLS e criar políticas
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plan_features_select_public" ON public.plan_features;
CREATE POLICY "plan_features_select_public" ON public.plan_features
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "plan_features_admin_all" ON public.plan_features;
CREATE POLICY "plan_features_admin_all" ON public.plan_features
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- 3. ai_agents: habilitar RLS e criar políticas (leitura pública para agentes ativos, escrita só admin)
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_agents_select_public" ON public.ai_agents;
CREATE POLICY "ai_agents_select_public" ON public.ai_agents
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "ai_agents_admin_all" ON public.ai_agents;
CREATE POLICY "ai_agents_admin_all" ON public.ai_agents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- 4. course_modules: habilitar RLS e criar políticas (mesmo padrão de courses)
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "course_modules_select_public" ON public.course_modules;
CREATE POLICY "course_modules_select_public" ON public.course_modules
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "course_modules_admin_all" ON public.course_modules;
CREATE POLICY "course_modules_admin_all" ON public.course_modules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );
