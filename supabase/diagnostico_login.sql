-- ==========================================
-- DIAGNÓSTICO DE LOGIN - MV COMPANY
-- Execute este script para verificar se o usuário foi criado corretamente
-- ==========================================

-- 1. Verificar se o usuário existe em auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'contato.mvcomp4ny@gmail.com';

-- 2. Verificar se o profile existe e tem a role correta
SELECT 
  p.id,
  p.email,
  p.role,
  p.full_name,
  p.created_at,
  p.updated_at,
  u.email_confirmed_at,
  u.last_sign_in_at
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.email = 'contato.mvcomp4ny@gmail.com';

-- 3. Se o usuário NÃO existe em auth.users, você precisa criá-lo via Dashboard
-- Vá em: Authentication → Users → Add user → Create new user
-- Email: contato.mvcomp4ny@gmail.com
-- Password: Mvc053149
-- Marque "Auto Confirm User"
-- Clique em "Create user"

-- 4. Se o usuário existe mas o profile não, execute:
INSERT INTO profiles (id, email, role, full_name, created_at, updated_at)
SELECT 
  id,
  email,
  'admin' as role,
  'Administrador MV Company' as full_name,
  created_at,
  NOW() as updated_at
FROM auth.users
WHERE email = 'contato.mvcomp4ny@gmail.com'
ON CONFLICT (id) DO UPDATE SET 
  role = 'admin',
  full_name = 'Administrador MV Company',
  updated_at = NOW();

-- 5. Se o usuário existe mas o email não está confirmado, execute:
-- (Isso geralmente não é necessário se você marcou "Auto Confirm User")
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = 'contato.mvcomp4ny@gmail.com'
  AND email_confirmed_at IS NULL;

-- 6. Verificar novamente após correções (versão simplificada)
-- Execute estas queries separadamente para ver os resultados:

-- Verificar auth.users
SELECT 
  'auth.users' as tabela,
  id::text as id,
  email,
  CASE WHEN email_confirmed_at IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as email_confirmado,
  created_at
FROM auth.users
WHERE email = 'contato.mvcomp4ny@gmail.com';

-- Verificar profiles
SELECT 
  'profiles' as tabela,
  id::text as id,
  email,
  role,
  CASE WHEN role = 'admin' THEN 'SIM' ELSE 'NÃO' END as tem_role_admin,
  created_at
FROM profiles
WHERE email = 'contato.mvcomp4ny@gmail.com';

