-- ==========================================
-- VERIFICAÇÃO: Setup do sistema de Analytics
-- ==========================================
-- Execute no SQL Editor do Supabase para conferir se tabela,
-- índices, políticas e função existem.
-- ==========================================

-- 1. Tabela page_analytics existe?
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'page_analytics'
) AS "Tabela page_analytics existe";

-- 2. Colunas da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'page_analytics'
ORDER BY ordinal_position;

-- 3. Índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'page_analytics'
ORDER BY indexname;

-- 4. Políticas RLS
SELECT policyname, cmd, qual AS using_expression
FROM pg_policies
WHERE tablename = 'page_analytics'
ORDER BY policyname;

-- 5. Função delete_page_analytics existe?
SELECT EXISTS (
  SELECT 1 FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'delete_page_analytics'
) AS "Função delete_page_analytics existe";

-- 6. Contagem de eventos (amostra)
SELECT COUNT(*) AS total_eventos FROM page_analytics;
SELECT event_type, COUNT(*) AS qtd
FROM page_analytics
GROUP BY event_type
ORDER BY qtd DESC;
