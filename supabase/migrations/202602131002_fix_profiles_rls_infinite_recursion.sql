-- Corrige "infinite recursion detected in policy for relation profiles".
-- As políticas que checavam "EXISTS (SELECT 1 FROM profiles...)" disparavam RLS de profiles de novo.
-- Usamos uma função SECURITY DEFINER que lê profiles com privilégios do owner (sem disparar RLS do usuário).

CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  );
$$;

COMMENT ON FUNCTION public.is_admin_or_editor() IS 'Usado por políticas RLS para evitar recursão: retorna true se o usuário atual é admin ou editor.';

-- Substituir políticas que referenciam profiles por uso da função (evita recursão)

DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;
CREATE POLICY "profiles_admin_select_all" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_admin_or_editor());

DROP POLICY IF EXISTS "subscriptions_admin_select_all" ON public.subscriptions;
CREATE POLICY "subscriptions_admin_select_all" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (public.is_admin_or_editor());

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_subscriptions') THEN
    DROP POLICY IF EXISTS "service_subscriptions_admin_select_all" ON public.service_subscriptions;
    CREATE POLICY "service_subscriptions_admin_select_all" ON public.service_subscriptions
      FOR SELECT TO authenticated
      USING (public.is_admin_or_editor());
  END IF;
END $$;
