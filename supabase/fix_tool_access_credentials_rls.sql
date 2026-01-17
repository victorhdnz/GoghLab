-- Verificar e corrigir políticas RLS para tool_access_credentials
-- Garantir que admins podem inserir, atualizar e visualizar todas as credenciais

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Admins can manage tool access" ON tool_access_credentials;
DROP POLICY IF EXISTS "Users can view own credentials" ON tool_access_credentials;
DROP POLICY IF EXISTS "Users can view their own tool access" ON tool_access_credentials;
DROP POLICY IF EXISTS "Admins can view all tool access" ON tool_access_credentials;

-- Criar política para usuários verem suas próprias credenciais
CREATE POLICY "Users can view their own tool access" ON tool_access_credentials
  FOR SELECT USING (auth.uid() = user_id);

-- Criar política para admins verem todas as credenciais
CREATE POLICY "Admins can view all tool access" ON tool_access_credentials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Criar política para admins inserirem credenciais
CREATE POLICY "Admins can insert tool access" ON tool_access_credentials
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Criar política para admins atualizarem credenciais
CREATE POLICY "Admins can update tool access" ON tool_access_credentials
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Criar política para admins deletarem credenciais (se necessário)
CREATE POLICY "Admins can delete tool access" ON tool_access_credentials
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Verificar se as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tool_access_credentials'
ORDER BY policyname, cmd;

