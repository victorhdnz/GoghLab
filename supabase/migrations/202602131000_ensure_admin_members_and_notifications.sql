-- Garantir que admin/editor veem todos os membros (profiles + subscriptions + service_subscriptions).
-- Reaplica políticas caso tenham sido removidas ou nunca aplicadas.

DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;
CREATE POLICY "profiles_admin_select_all" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "subscriptions_admin_select_all" ON public.subscriptions;
CREATE POLICY "subscriptions_admin_select_all" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
    )
  );

-- service_subscriptions: permitir admin/editor ver todos (para Gerenciar Membros)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_subscriptions') THEN
    DROP POLICY IF EXISTS "service_subscriptions_admin_select_all" ON public.service_subscriptions;
    CREATE POLICY "service_subscriptions_admin_select_all" ON public.service_subscriptions
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
        )
      );
  END IF;
END $$;
