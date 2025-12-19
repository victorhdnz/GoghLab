-- ==========================================
-- CRIAR USUÁRIO ADMIN COM EMAIL/SENHA
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- ⚠️ IMPORTANTE: No Supabase, não é possível criar usuário diretamente via SQL
-- porque a senha precisa ser criptografada. Use uma das opções abaixo:

-- ==========================================
-- OPÇÃO 1: Criar via Supabase Dashboard (RECOMENDADO)
-- ==========================================
-- 1. Vá em Authentication → Users → Add user → Create new user
-- 2. Email: seu-email@exemplo.com
-- 3. Password: [DEFINA UMA SENHA FORTE]
-- 4. Marque "Auto Confirm User"
-- 5. Clique em "Create user"
--
-- Após criar o usuário no Dashboard, execute este SQL para definir como admin:
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';

-- ==========================================
-- OPÇÃO 2: Criar via API (usando Service Role Key)
-- ==========================================
-- Você pode criar usuários via API usando o Service Role Key.
-- Exemplo usando curl ou uma ferramenta de API:
--
-- curl -X POST 'https://SEU-PROJETO.supabase.co/auth/v1/admin/users' \
--   -H "apikey: SEU_SERVICE_ROLE_KEY" \
--   -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
--   -H "Content-Type: application/json" \
--   -d '{
--     "email": "seu-email@exemplo.com",
--     "password": "senha-forte-aqui",
--     "email_confirm": true,
--     "user_metadata": {
--       "full_name": "Administrador"
--     }
--   }'
--
-- Depois execute o UPDATE acima para tornar admin.

-- ==========================================
-- OPÇÃO 3: Criar Profile Manualmente (se usuário já existe)
-- ==========================================
-- Se o usuário já existe em auth.users mas não tem profile:
-- (Substitua 'UUID_DO_USUARIO' pelo ID do usuário de auth.users)
/*
INSERT INTO profiles (id, email, role, full_name, created_at, updated_at)
SELECT 
  id,
  email,
  'admin' as role,
  COALESCE(raw_user_meta_data->>'full_name', 'Administrador') as full_name,
  created_at,
  NOW() as updated_at
FROM auth.users
WHERE email = 'seu-email@exemplo.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
*/

-- ==========================================
-- VERIFICAR SE FUNCIONOU
-- ==========================================
SELECT 
  p.id,
  p.email,
  p.role,
  p.full_name,
  u.email_confirmed_at,
  u.created_at
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.email = 'seu-email@exemplo.com';

-- ==========================================
-- CRIAR MÚLTIPLOS ADMINISTRADORES
-- ==========================================
UPDATE profiles 
SET role = 'admin' 
WHERE email IN (
  'admin1@exemplo.com',
  'admin2@exemplo.com',
  'admin3@exemplo.com'
);

-- ==========================================
-- NOTAS IMPORTANTES
-- ==========================================
-- 1. O trigger handle_new_user() cria automaticamente um profile quando um usuário é criado
-- 2. Se o profile não for criado automaticamente, use a OPÇÃO 3 acima
-- 3. Sempre verifique se o usuário existe em auth.users antes de criar o profile
-- 4. A senha NÃO pode ser definida via SQL - use Dashboard ou API
