# ✅ Checklist de Configuração do Supabase

## 🔐 Configurações de Autenticação

### 1. URLs de Redirecionamento (OBRIGATÓRIO)
No Supabase Dashboard, vá em **Authentication** > **URL Configuration**:

- [ ] **Site URL**: Configure com a URL do seu site
  - Desenvolvimento: `http://localhost:3000`
  - Produção: `https://seu-dominio.com` (ou URL da Vercel)

- [ ] **Redirect URLs**: Adicione todas as URLs necessárias:
  ```
  http://localhost:3000/**
  http://localhost:3000/auth/callback
  https://seu-dominio.com/**
  https://seu-dominio.com/auth/callback
  https://seu-projeto.vercel.app/**
  https://seu-projeto.vercel.app/auth/callback
  ```

**⚠️ IMPORTANTE**: Sem essas URLs configuradas, o login não funcionará!

---

## 🗄️ Banco de Dados

### 2. Schema SQL
- [x] Schema `schema_mv_company.sql` executado ✅

### 3. Verificar Tabelas Criadas
No Supabase Dashboard, vá em **Table Editor** e verifique se existem:
- [ ] `profiles`
- [ ] `services`
- [ ] `service_testimonials`
- [ ] `portfolio_layouts`
- [ ] `portfolio_pages`
- [ ] `portfolio_analytics`
- [ ] `company_comparisons`
- [ ] `saved_comparisons`
- [ ] `site_settings`
- [ ] `site_terms`

---

## 📦 Storage (Buckets)

### 4. Buckets Criados
No Supabase Dashboard, vá em **Storage** e verifique se existem (todos públicos):
- [x] `portfolio` ✅
- [x] `testimonials` ✅
- [x] `comparisons` ✅
- [x] `banners` ✅
- [x] `profiles` ✅
- [x] `videos` ✅
- [ ] `services` ⚠️ **FALTA CRIAR**

### 5. Políticas de Storage
Os buckets devem ter políticas que permitam:
- [ ] **Leitura pública** (para imagens serem acessíveis)
- [ ] **Upload apenas para admins/editores** (via RLS)

**Nota**: As políticas RLS já estão no schema SQL, mas verifique se estão ativas.

---

## 👤 Usuário Administrador

### 6. Criar Usuário Admin
- [ ] Criar usuário no **Authentication** > **Users**:
  - Email: `contato.mvcomp4ny@gmail.com`
  - Password: `Mvc053149`
  - Marcar "Auto Confirm User"

- [ ] Executar SQL de `supabase/criar_admin_mv_company.sql` para definir role como `admin`

### 7. Verificar Perfil
No **Table Editor** > **profiles**, verifique se:
- [ ] O usuário existe
- [ ] O campo `role` está como `admin`
- [ ] O email está correto

---

## 🔑 Variáveis de Ambiente

### 8. Verificar Credenciais
No Supabase Dashboard, vá em **Settings** > **API** e confirme que você tem:
- [x] **Project URL** → Usado em `NEXT_PUBLIC_SUPABASE_URL` ✅
- [x] **anon public** → Usado em `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- [x] **service_role** → Usado em `SUPABASE_SERVICE_ROLE_KEY` ✅

**⚠️ IMPORTANTE**: 
- A `service_role` key deve ser mantida **SECRETA**
- Nunca exponha a `service_role` key no frontend
- Use apenas em rotas de API server-side

---

## 🧪 Testes

### 9. Testar Conexão
Após configurar tudo, teste:

1. **Testar autenticação**:
   - Acesse `/dashboard`
   - Tente fazer login com `contato.mvcomp4ny@gmail.com`
   - Deve funcionar se tudo estiver configurado

2. **Testar storage**:
   - Tente fazer upload de uma imagem no dashboard
   - Verifique se aparece no bucket correto

3. **Testar queries**:
   - Verifique se consegue criar/editar serviços
   - Verifique se consegue criar/editar depoimentos

---

## 📝 Notas Importantes

### O que NÃO precisa configurar no Supabase:
- ❌ Variáveis de ambiente (isso é feito no `.env` e Vercel)
- ❌ Edge Functions (não estamos usando)
- ❌ Webhooks (não estamos usando)
- ❌ Database backups (já vem configurado por padrão)

### O que JÁ está configurado pelo schema SQL:
- ✅ RLS (Row Level Security) policies
- ✅ Triggers e funções
- ✅ Índices para performance
- ✅ Dados iniciais

---

## 🆘 Problemas Comuns

### Erro: "Invalid API key"
- Verifique se as variáveis de ambiente estão corretas
- Verifique se está usando a key correta (anon vs service_role)

### Erro: "Redirect URL mismatch"
- Adicione a URL no **Authentication** > **URL Configuration**
- Certifique-se de incluir `/**` no final

### Erro: "Permission denied"
- Verifique se o usuário tem role `admin` na tabela `profiles`
- Verifique se as políticas RLS estão ativas

### Imagens não aparecem
- Verifique se o bucket é **público**
- Verifique se as políticas de storage permitem leitura pública

---

**Última atualização**: Após executar o schema SQL e criar os buckets

