-- Migration: Adicionar coluna detail_layout na tabela services
-- Para armazenar o layout específico de cada serviço

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS detail_layout JSONB DEFAULT '{}';

-- Comentário explicativo
COMMENT ON COLUMN services.detail_layout IS 'Layout detalhado da página do serviço (hero, benefits, gifts, etc.)';

