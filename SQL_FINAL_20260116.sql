-- =====================================================
-- MIGRAÇÃO FINAL - SISTEMA DE FERRAMENTAS E CURSOS
-- Execute este SQL no Supabase SQL Editor
-- Data: 2026-01-16
-- =====================================================

-- 1. Adicionar campos na tabela tool_access_credentials
-- =====================================================
DO $$
BEGIN
  -- Adicionar access_link se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tool_access_credentials' AND column_name = 'access_link') THEN
    ALTER TABLE tool_access_credentials ADD COLUMN access_link TEXT;
  END IF;
  
  -- Adicionar error_reported se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tool_access_credentials' AND column_name = 'error_reported') THEN
    ALTER TABLE tool_access_credentials ADD COLUMN error_reported BOOLEAN DEFAULT false;
  END IF;
  
  -- Adicionar error_message se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tool_access_credentials' AND column_name = 'error_message') THEN
    ALTER TABLE tool_access_credentials ADD COLUMN error_message TEXT;
  END IF;
END $$;

-- 2. Garantir que support_tickets aceita 'tools_access'
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets') THEN
    -- Remover constraint antiga se existir
    ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_ticket_type_check;
    -- Recriar com 'tools_access'
    ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_ticket_type_check 
      CHECK (ticket_type IN ('canva_access', 'capcut_access', 'tools_access', 'general', 'bug_report', 'feature_request'));
  END IF;
END $$;

-- 3. Adicionar configuração de vídeo tutorial (opcional)
-- =====================================================
-- Nota: A tabela site_settings usa value como JSONB, então vamos armazenar como string JSON
INSERT INTO site_settings (key, value, description) 
VALUES (
  'tools_tutorial_video', 
  '"https://www.youtube.com/embed/VIDEO_ID_AQUI"'::jsonb, 
  'URL do vídeo tutorial para ativar ferramentas (Canva/CapCut). Use formato embed do YouTube/Vimeo.'
)
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value, 
  description = EXCLUDED.description;

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
-- Após executar, verifique se os campos foram adicionados:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'tool_access_credentials' 
-- ORDER BY ordinal_position;
