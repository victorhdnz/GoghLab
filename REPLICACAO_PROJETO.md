# 📋 Guia Completo de Replicação do Projeto

Este documento contém todas as informações necessárias para replicar este **Editor de Landing Page / Comparador de Produtos** para outras empresas.

---

## 📑 Índice

1. [Configurações Externas](#1-configurações-externas)
2. [Banco de Dados](#2-banco-de-dados)
3. [Storage (Buckets)](#3-storage-buckets)
4. [Variáveis de Ambiente](#4-variáveis-de-ambiente)
5. [Configuração de Administrador](#5-configuração-de-administrador)
6. [Deploy](#6-deploy)

---

## 1. Configurações Externas

### 1.1. Supabase

#### Criar Projeto
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova organização (se necessário)
3. Clique em **"New Project"**
4. Preencha:
   - **Name**: Nome do projeto (ex: "Landing Page Editor [Nome da Empresa]")
   - **Database Password**: Senha forte (salve em local seguro)
   - **Region**: Escolha a região mais próxima dos usuários
5. Aguarde a criação do projeto (2-3 minutos)

#### Obter Credenciais
1. No painel do Supabase, vá em **Settings** > **API**
2. Copie as seguintes credenciais:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **MANTENHA SECRETO**

#### Configurar URLs de Redirecionamento
1. Vá em **Authentication** > **URL Configuration**
2. Configure:
   - **Site URL**: `https://seu-dominio.com` (produção) ou `http://localhost:3000` (dev)
   - **Redirect URLs**: Adicione todas as URLs necessárias:
     ```
     https://seu-dominio.com/**
     https://seu-dominio.com/auth/callback
     http://localhost:3000/**
     http://localhost:3000/auth/callback
     ```

---

### 1.2. Cloudinary (Upload de Imagens e Vídeos)

#### Criar Conta
1. Acesse [cloudinary.com](https://cloudinary.com)
2. Crie uma conta gratuita
3. Após criar, você será redirecionado para o Dashboard

#### Obter Credenciais
1. No Dashboard, você verá:
   - **Cloud name** → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET` ⚠️ **MANTENHA SECRETO**

#### Configurar Upload Presets (Opcional)
1. Vá em **Settings** > **Upload**
2. Em **Upload presets**, você pode criar presets personalizados
3. Para este projeto, não é necessário configurar presets

---

### 1.3. Vercel (Hospedagem)

#### Conectar Repositório
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub/GitLab/Bitbucket
3. Clique em **"Add New"** > **"Project"**
4. Importe o repositório do projeto
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (raiz)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### Configurar Variáveis de Ambiente
1. No projeto na Vercel, vá em **Settings** > **Environment Variables**
2. Adicione **TODAS** as variáveis listadas na seção [Variáveis de Ambiente](#4-variáveis-de-ambiente), incluindo:
   - ✅ **Supabase** (URL, Anon Key, Service Role Key)
   - ✅ **Cloudinary** (Cloud Name, API Key, API Secret)
   - ✅ **Configurações do Site** (Site URL, Site Name)
3. Configure para cada ambiente:
   - **Production**: Produção (marque todas)
   - **Preview**: Preview/Staging (opcional)
   - **Development**: Desenvolvimento (opcional)
4. **⚠️ IMPORTANTE**: Sem as variáveis do Supabase, o projeto não funcionará em produção!

#### Configurar Domínio Personalizado
1. Vá em **Settings** > **Domains**
2. Adicione seu domínio personalizado
3. Siga as instruções para configurar DNS
4. Após configurar, atualize:
   - `NEXT_PUBLIC_SITE_URL` na Vercel
   - Site URL no Supabase

---

## 2. Banco de Dados

### 2.1. Executar SQL Completo

1. No Supabase, vá em **SQL Editor**
2. Clique em **"New query"**
3. Copie **TODO** o conteúdo do arquivo `supabase/schema_completo_landing_editor.sql`
4. Cole no editor
5. Clique em **"Run"** (ou `Ctrl/Cmd + Enter`)
6. Aguarde a execução (pode levar alguns minutos)
7. Verifique se todas as tabelas foram criadas em **Table Editor**

**⚠️ IMPORTANTE**: O arquivo `schema_completo_landing_editor.sql` contém todas as tabelas necessárias para o Editor de Landing Page e Comparador de Produtos.

### 2.2. Estrutura do Banco

O banco de dados contém as seguintes tabelas:

- **profiles**: Usuários e perfis
- **products**: Catálogo de produtos
- **product_colors**: Variações de cor dos produtos
- **landing_layouts**: Layouts principais de landing pages
- **landing_versions**: Versões/campanhas de landing pages
- **landing_analytics**: Analytics e tracking
- **product_comparisons**: Dados de comparação de produtos
- **saved_comparisons**: Links de comparação salvos
- **product_support_pages**: Páginas de suporte/manuais
- **product_catalogs**: Catálogos de produtos
- **site_settings**: Configurações globais do site
- **site_terms**: Termos de uso e políticas

### 2.3. Row Level Security (RLS)

Todas as tabelas têm RLS habilitado com políticas de segurança:
- Usuários só veem seus próprios dados
- Produtos são públicos para leitura
- Apenas admins/editores podem modificar produtos e landing pages
- Analytics podem ser inseridos por todos (para tracking), mas apenas admins podem ler

---

## 3. Storage (Buckets)

### 3.1. Criar Buckets

No Supabase, você precisa criar 4 buckets de storage. Siga os passos abaixo:

1. No painel do Supabase, vá em **Storage** (ícone de pasta no menu lateral)
2. Clique na aba **"Buckets"** (se não estiver selecionada)
3. Clique no botão **"+ New bucket"** (canto superior direito)
4. Crie cada bucket com as configurações abaixo:

#### Bucket 1: `products`
- **Name**: `products` (exatamente este nome)
- **Public bucket**: ✅ **SIM** (marque esta opção - muito importante!)
- **File size limit**: 10 MB (ou deixe "Unset" para usar o padrão de 50 MB)
- **Allowed MIME types**: `image/*` (ou deixe "Any" para permitir todos)

#### Bucket 2: `banners`
- **Name**: `banners` (exatamente este nome)
- **Public bucket**: ✅ **SIM** (marque esta opção)
- **File size limit**: 5 MB (ou deixe "Unset" para usar o padrão)
- **Allowed MIME types**: `image/*` (ou deixe "Any")

#### Bucket 3: `profiles`
- **Name**: `profiles` (exatamente este nome)
- **Public bucket**: ✅ **SIM** (marque esta opção)
- **File size limit**: 2 MB (ou deixe "Unset" para usar o padrão)
- **Allowed MIME types**: `image/*` (ou deixe "Any")

#### Bucket 4: `videos`
- **Name**: `videos` (exatamente este nome)
- **Public bucket**: ✅ **SIM** (marque esta opção)
- **File size limit**: 100 MB (ou deixe "Unset" para usar o padrão de 50 MB)
- **Allowed MIME types**: `video/*` (ou deixe "Any")

**⚠️ IMPORTANTE**: 
- Todos os buckets devem ser marcados como **PUBLIC**
- Os nomes devem ser exatamente como mostrado acima (minúsculas)
- Após criar cada bucket, você verá uma badge laranja "PUBLIC" ao lado do nome

### 3.2. Configurar Políticas RLS

Execute o arquivo `supabase/setup_storage_policies_landing_editor.sql` no SQL Editor do Supabase.

Isso configurará:
- Admins/editores podem fazer upload em `products`, `banners` e `videos`
- Todos podem ver imagens e vídeos (buckets públicos)
- Usuários podem fazer upload apenas de seu próprio avatar em `profiles`

---

## 4. Variáveis de Ambiente

### 4.1. Arquivo `.env.local` (Desenvolvimento)

Crie o arquivo `.env.local` na raiz do projeto:

```env
# ============================================
# Supabase
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui

# ============================================
# Cloudinary
# ============================================
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-api-key
CLOUDINARY_API_SECRET=seu-api-secret

# ============================================
# Configurações do Site
# ============================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Nome da Empresa

```

### 4.2. Variáveis na Vercel (Produção)

**⚠️ IMPORTANTE**: Você precisa adicionar **TODAS** as variáveis de ambiente na Vercel, incluindo as do Supabase e Cloudinary.

1. No projeto na Vercel, vá em **Settings** > **Environment Variables**
2. Adicione **cada uma** das seguintes variáveis:

```env
# ============================================
# Supabase (OBRIGATÓRIO)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui

# ============================================
# Cloudinary (OBRIGATÓRIO)
# ============================================
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-api-key
CLOUDINARY_API_SECRET=seu-api-secret

# ============================================
# Configurações do Site (OBRIGATÓRIO)
# ============================================
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
NEXT_PUBLIC_SITE_NAME=Nome da Empresa

```

3. Para cada variável, configure o ambiente:
   - **Production**: Marque para produção
   - **Preview**: Marque para preview/staging (opcional)
   - **Development**: Marque para desenvolvimento (opcional)

4. **⚠️ ATENÇÃO**: 
   - Use os valores de **produção** do Supabase (não os de desenvolvimento)
   - Use o `NEXT_PUBLIC_SITE_URL` com o domínio de produção
   - As chaves do Supabase são as mesmas, mas certifique-se de usar as corretas do seu projeto

---

## 5. Configuração de Administrador

### 5.1. Criar Usuário com Email e Senha

**⚠️ IMPORTANTE**: No Supabase, você precisa criar o usuário primeiro na seção Authentication, e depois executar um SQL para torná-lo administrador. Siga os passos abaixo:

#### Passo 1: Criar Usuário via Authentication (Supabase Dashboard)

1. No painel do Supabase, vá em **Authentication** (ícone de cadeado no menu lateral)
2. Clique na aba **"Users"** (se não estiver selecionada)
3. Clique no botão verde **"Add user"** (canto superior direito)
4. Selecione **"Create new user"** no dropdown
5. Preencha o formulário:
   - **Email**: `seu-email@exemplo.com` (exemplo: `admin@exemplo.com`)
   - **Password**: [Defina uma senha forte]
   - ✅ **Marque "Auto Confirm User"** (muito importante! Isso evita necessidade de confirmação por email)
6. Clique em **"Create user"**
7. O usuário será criado e aparecerá na tabela de usuários

#### Passo 2: Tornar Usuário Administrador (Via SQL)

Após criar o usuário, você precisa executar um SQL para torná-lo administrador:

1. No Supabase, vá em **SQL Editor** (ícone de código no menu lateral)
2. Clique em **"New query"**
3. Execute o seguinte SQL (substitua `seu-email@exemplo.com` pelo email que você acabou de criar):

```sql
-- Tornar usuário admin por email
UPDATE profiles
SET role = 'admin'
WHERE email = 'seu-email@exemplo.com';
```

4. Clique em **"Run"** (ou `Ctrl/Cmd + Enter`)
5. Verifique se funcionou executando:

```sql
-- Verificar se o usuário foi configurado como admin
SELECT id, email, role, full_name 
FROM profiles 
WHERE email = 'seu-email@exemplo.com';
```

Você deve ver `role = 'admin'` no resultado.

**📝 Nota**: O trigger `handle_new_user()` cria automaticamente um registro na tabela `profiles` quando um usuário é criado em `auth.users`. Se por algum motivo o profile não foi criado automaticamente, consulte a seção 5.2 abaixo.

#### Opção B: Via API (usando Service Role Key)

Você pode criar usuários via API usando o Service Role Key:

```bash
curl -X POST 'https://SEU-PROJETO.supabase.co/auth/v1/admin/users' \
  -H "apikey: SEU_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu-email@exemplo.com",
    "password": "senha-forte-aqui",
    "email_confirm": true,
    "user_metadata": {
      "full_name": "Administrador"
    }
  }'
```

Depois execute o SQL acima para tornar admin.

### 5.2. Tornar Usuário Admin (Via SQL)

Após criar o usuário (por qualquer método acima):

1. No Supabase, vá em **SQL Editor**
2. Execute o seguinte SQL (substitua `email@exemplo.com` pelo email do administrador):

```sql
-- Tornar usuário admin por email
UPDATE profiles
SET role = 'admin'
WHERE email = 'email@exemplo.com';
```

### 5.4. Via Table Editor

1. No Supabase, vá em **Table Editor** > **profiles**
2. Encontre o usuário pelo email
3. Edite o campo `role` para `admin`
4. Salve

### 5.5. Múltiplos Administradores

Para configurar múltiplos administradores de uma vez:

```sql
-- Tornar múltiplos usuários admin
UPDATE profiles
SET role = 'admin'
WHERE email IN (
  'admin1@exemplo.com',
  'admin2@exemplo.com',
  'admin3@exemplo.com'
);
```

### 5.6. Verificar Permissões

Após configurar:

1. Faça logout do sistema (se estiver logado)
2. Faça login novamente com o email e senha que você criou
3. Você deve ter acesso ao dashboard em `/dashboard`

**📝 Nota**: O trigger `handle_new_user()` cria automaticamente um profile quando um usuário é criado em `auth.users`. Se o profile não for criado automaticamente, consulte a seção 5.2 acima ou o arquivo `supabase/criar_usuario_admin.sql` para mais opções.

---

## 6. Deploy

### 6.1. Deploy na Vercel

1. Conecte o repositório (seção 1.4)
2. **Configure TODAS as variáveis de ambiente** (veja seção [4.2 - Variáveis na Vercel](#42-variáveis-na-vercel-produção))
   - ⚠️ **OBRIGATÓRIO**: Inclua todas as variáveis do Supabase e Cloudinary
   - Sem essas variáveis, o projeto não funcionará em produção
3. Clique em **"Deploy"**
4. Aguarde o build completar
5. Acesse a URL fornecida

### 6.2. Configurar Domínio Personalizado

1. Na Vercel, vá em **Settings** > **Domains**
2. Adicione seu domínio
3. Configure os registros DNS conforme instruções
4. Aguarde a propagação (pode levar até 24h)
5. Atualize:
   - `NEXT_PUBLIC_SITE_URL` na Vercel
   - Site URL no Supabase

### 6.3. Verificações Pós-Deploy

- [ ] Login funciona
- [ ] Upload de imagens funciona (Cloudinary)
- [ ] Upload de vídeos funciona (Supabase Storage)
- [ ] Dashboard está acessível apenas para admins
- [ ] Landing pages são renderizadas corretamente
- [ ] Comparador de produtos funciona
- [ ] Catálogos são exibidos corretamente
- [ ] Páginas de suporte funcionam

---

## 📝 Checklist Final

Antes de considerar o projeto replicado:

- [ ] Supabase configurado e SQL executado
- [ ] Buckets criados e políticas configuradas
- [ ] Cloudinary configurado
- [ ] **Variáveis de ambiente configuradas LOCALMENTE** (`.env.local`)
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
  - [ ] `CLOUDINARY_API_KEY`
  - [ ] `CLOUDINARY_API_SECRET`
  - [ ] `NEXT_PUBLIC_SITE_URL`
  - [ ] `NEXT_PUBLIC_SITE_NAME`
- [ ] **Variáveis de ambiente configuradas na VERCEL** (Settings > Environment Variables)
  - [ ] ⚠️ **TODAS as variáveis obrigatórias acima devem estar na Vercel também!**
  - [ ] Especialmente as do Supabase (sem elas o projeto não funciona em produção)
  - [ ] Variáveis opcionais podem ser adicionadas depois se necessário
- [ ] Administrador configurado
- [ ] Deploy realizado na Vercel
- [ ] Domínio personalizado configurado
- [ ] Testes básicos realizados

---

## 🆘 Troubleshooting

### Erro: "Invalid API key" (Supabase)
- Verifique se copiou as chaves corretas
- Certifique-se de usar `NEXT_PUBLIC_` para chaves públicas

### Erro: "Unauthorized" no Dashboard
- Verifique se o usuário tem `role = 'admin'` na tabela `profiles`
- Faça logout e login novamente

### Imagens não carregam
- Verifique se os buckets estão marcados como públicos
- Verifique as políticas RLS dos buckets
- Verifique as credenciais do Cloudinary

### Vídeos não carregam
- Verifique se o bucket `videos` foi criado e está público
- Verifique as políticas RLS do bucket `videos`
- Verifique se o tamanho do arquivo não excede o limite (100MB)

### Landing pages não aparecem
- Verifique se o layout está ativo (`is_active = true`)
- Verifique se a versão está ativa e é a padrão (`is_default = true`)
- Verifique se as seções estão configuradas corretamente

---

## 📚 Documentação Adicional

- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do Next.js](https://nextjs.org/docs)
- [Documentação do Cloudinary](https://cloudinary.com/documentation)

---

**Última atualização**: 2025
