-- ==========================================
-- OPCIONAL: Permitir que assinantes Gogh Pro leiam page_analytics
-- ==========================================
-- Use isto se a página pública /analytics for exibir os mesmos dados
-- do dashboard (resumo, gráficos, etc.) para usuários do plano Pro.
-- Sem esta policy, apenas admin/editor conseguem SELECT na tabela.
-- ==========================================
-- INSTRUÇÕES: Execute no SQL Editor do Supabase
-- ==========================================

-- Política: usuários autenticados com assinatura ativa e plan_id = 'gogh_pro'
-- podem fazer SELECT em page_analytics (somente leitura).
DROP POLICY IF EXISTS "Pro users can view analytics" ON page_analytics;
CREATE POLICY "Pro users can view analytics" ON page_analytics
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1
      FROM subscriptions s
      WHERE s.user_id = auth.uid()
        AND s.status = 'active'
        AND (s.current_period_end IS NULL OR s.current_period_end >= NOW())
        AND s.plan_id = 'gogh_pro'
    )
  );

-- Verificação (opcional): listar políticas atuais da tabela
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'page_analytics';
