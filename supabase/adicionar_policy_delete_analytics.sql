-- ==========================================
-- ADICIONAR POLÍTICA DELETE PARA page_analytics
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- Política: Apenas admins e editors podem deletar analytics
DROP POLICY IF EXISTS "Admins and editors can delete analytics" ON page_analytics;
CREATE POLICY "Admins and editors can delete analytics" ON page_analytics
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'editor')
    )
  );

