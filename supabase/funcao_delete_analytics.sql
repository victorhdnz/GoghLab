-- ==========================================
-- FUNÇÃO RPC PARA DELETAR ANALYTICS
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- Criar função para deletar analytics com filtros
CREATE OR REPLACE FUNCTION delete_page_analytics(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_page_type VARCHAR(50) DEFAULT NULL,
  p_page_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Verificar se o usuário é admin ou editor
  IF NOT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'editor')
  ) THEN
    RAISE EXCEPTION 'Apenas admins e editors podem deletar analytics';
  END IF;

  -- Construir query de delete dinamicamente
  DELETE FROM page_analytics
  WHERE 
    (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date)
    AND (p_page_type IS NULL OR page_type = p_page_type)
    AND (p_page_id IS NULL OR page_id = p_page_id);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Dar permissão para a função ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION delete_page_analytics TO authenticated;

