-- ==========================================
-- VERIFICAR E CORRIGIR USUÁRIO EXISTENTE
-- Execute este script para verificar e corrigir o usuário
-- ==========================================

-- 1. PRIMEIRO: Verificar se o usuário existe em auth.users
SELECT 
  'auth.users' as origem,
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Email NÃO confirmado'
    ELSE '✅ Email confirmado'
  END as status_email
FROM auth.users
WHERE email = 'contato.mvcomp4ny@gmail.com';

-- 2. SEGUNDO: Verificar se o profile existe
SELECT 
  'profiles' as origem,
  id,
  email,
  role,
  full_name,
  created_at,
  updated_at,
  CASE 
    WHEN role = 'admin' THEN '✅ É admin'
    WHEN role = 'editor' THEN '⚠️ É editor (pode acessar)'
    ELSE '❌ Role: ' || role || ' (NÃO pode acessar dashboard)'
  END as status_role
FROM profiles
WHERE email = 'contato.mvcomp4ny@gmail.com';

-- 3. TERCEIRO: Se o usuário existe mas o email não está confirmado, execute:
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email = 'contato.mvcomp4ny@gmail.com'
  AND email_confirmed_at IS NULL;

-- 4. QUARTO: Garantir que o profile existe e tem role admin
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

-- 5. QUINTO: Verificar novamente após correções
SELECT 
  'RESULTADO FINAL' as status,
  u.id,
  u.email,
  CASE WHEN u.email_confirmed_at IS NOT NULL THEN '✅' ELSE '❌' END as email_confirmado,
  p.role,
  CASE WHEN p.role IN ('admin', 'editor') THEN '✅' ELSE '❌' END as pode_acessar_dashboard
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'contato.mvcomp4ny@gmail.com';

-- ==========================================
-- SE AINDA NÃO FUNCIONAR:
-- ==========================================
-- Pode ser que a senha esteja errada. Nesse caso, você pode:
-- 1. Deletar o usuário existente (se possível)
-- 2. Ou resetar a senha via Supabase Dashboard
-- 3. Ou criar um novo usuário com email diferente temporariamente

