-- Admin e editor podem ver todos os profiles e todas as subscriptions no dashboard (Gerenciar Membros).
-- Sem isso, a RLS restringe cada usuário ao próprio perfil e a lista de membros fica vazia para o admin.

DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;
CREATE POLICY "profiles_admin_select_all" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "subscriptions_admin_select_all" ON public.subscriptions;
CREATE POLICY "subscriptions_admin_select_all" ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
    )
  );

-- service_subscriptions: se a tabela existir e não houver política de admin, descomente e adapte no Supabase
-- (em muitos projetos já existe service_subscriptions_select_admin)
