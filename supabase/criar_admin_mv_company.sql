-- ==========================================
-- CRIAR USUÁRIO ADMIN MV COMPANY
-- Execute este script após criar o usuário no Supabase Dashboard
-- ==========================================
--
-- INSTRUÇÕES:
-- 1. Vá em Authentication → Users → Add user → Create new user
-- 2. Email: contato.mvcomp4ny@gmail.com
-- 3. Password: Mvc053149
-- 4. Marque "Auto Confirm User"
-- 5. Clique em "Create user"
--
-- 6. Após criar o usuário, execute o SQL abaixo para definir como admin:

-- Definir role como admin
UPDATE profiles 
SET role = 'admin',
    full_name = 'Administrador MV Company'
WHERE email = 'contato.mvcomp4ny@gmail.com';

-- Se o profile não existir ainda (pode levar alguns segundos para o trigger criar),
-- execute este comando para criar manualmente:
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
  full_name = 'Administrador MV Company';

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
WHERE p.email = 'contato.mvcomp4ny@gmail.com';

-- ==========================================
-- NOTAS
-- ==========================================
-- O trigger handle_new_user() cria automaticamente um profile quando um usuário é criado
-- Se o profile não for criado automaticamente, o INSERT acima irá criar
-- A senha NÃO pode ser definida via SQL - use o Dashboard do Supabase

