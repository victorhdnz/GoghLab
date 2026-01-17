-- Adicionar coluna password na tabela tool_access_credentials
-- Para armazenar senha do CapCut separadamente do email/usuário

DO $$
BEGIN
  -- Adicionar password se não existir
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'tool_access_credentials' 
    AND column_name = 'password'
  ) THEN
    ALTER TABLE tool_access_credentials ADD COLUMN password TEXT;
  END IF;
END $$;

-- Verificar se a coluna foi criada
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'tool_access_credentials'
AND column_name IN ('email', 'access_link', 'password')
ORDER BY column_name;

