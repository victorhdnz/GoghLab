# 🔐 Configurar Google OAuth no Supabase

Este guia explica como configurar a autenticação com Google no Supabase para a Gogh Lab.

---

## 📋 Pré-requisitos

1. Conta no Google Cloud Platform (gratuita)
2. Projeto no Supabase
3. Acesso ao dashboard do Supabase

---

## 🚀 Passo a Passo

### 1. Criar Projeto no Google Cloud Platform

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em **"Selecionar um projeto"** → **"Novo Projeto"**
3. Nome do projeto: `Gogh Lab` (ou outro nome)
4. Clique em **"Criar"**

### 2. Habilitar Google+ API

1. No menu lateral, vá em **"APIs e Serviços"** → **"Biblioteca"**
2. Procure por **"Google+ API"**
3. Clique em **"Ativar"**

### 3. Criar Credenciais OAuth 2.0 no Google Cloud

1. Vá em **"APIs e Serviços"** → **"Credenciais"**
2. Clique em **"+ Criar Credenciais"** → **"ID do cliente OAuth"**
3. Se solicitado, configure a tela de consentimento:
   - **Tipo de usuário**: Externo
   - **Nome do app**: Gogh Lab
   - **Email de suporte**: contato.goghlab@gmail.com
   - **Domínios autorizados**: `goghlab.com.br`
   - Clique em **"Salvar e continuar"**
   - Pule as etapas de escopos e usuários de teste (ou configure se necessário)
   - Clique em **"Voltar ao painel"**

4. **Configure o ID do cliente OAuth** (AQUI NO GOOGLE CLOUD):
   - **Tipo de aplicativo**: Aplicativo da Web
   - **Nome**: Gogh Lab Web App
   - **URIs de redirecionamento autorizados** (adicione estas 2 URLs):
     ```
     https://qutdejthpofutisspuai.supabase.co/auth/v1/callback
     https://goghlab.com.br/auth/callback
     ```
     💡 **Seu Project ID**: `qutdejthpofutisspuai`
     - Acesse [app.supabase.com](https://app.supabase.com)
     - Selecione seu projeto
     - Veja a URL no topo: `https://[SEU-ID].supabase.co`
     - O ID é a parte entre `https://` e `.supabase.co`
     - Ou vá em Settings → API e veja "Project URL"
     - 📖 **Guia completo**: `docs/COMO_ENCONTRAR_ID_SUPABASE.md`
     ✅ **Use o domínio de produção desde o início para evitar reconfiguração**
   
5. Clique em **"Criar"**
6. **Copie o Client ID e Client Secret** (você vai usar no Supabase!)

---

### 4. Configurar no Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá em **"Authentication"** → **"Providers"**
4. Encontre **"Google"** na lista
5. Clique para habilitar
6. Cole as credenciais:
   - **Client ID (for Google OAuth)**: Cole o ID do Cliente
   - **Client Secret (for Google OAuth)**: Cole o Segredo do Cliente
7. Clique em **"Save"**

---

### 5. Configurar URLs de Redirecionamento no Supabase

Agora configure as URLs no Supabase Dashboard:

1. Vá em **"Authentication"** → **"URL Configuration"**
2. Adicione as URLs permitidas:
   - **Site URL**: `https://goghlab.com.br`
   - **Redirect URLs** (adicione estas 2):
     ```
     https://goghlab.com.br/auth/callback
     https://qutdejthpofutisspuai.supabase.co/auth/v1/callback
     ```
     💡 **Seu Project ID**: `qutdejthpofutisspuai`
     ✅ **Configuramos com o domínio de produção desde o início**
3. Clique em **"Save"**

---

### 6. Testar a Configuração

1. No Supabase Dashboard, vá em **"Authentication"** → **"Users"**
2. Clique em **"Add user"** → **"Invite user via email"** (ou teste via interface)
3. Ou use a interface de login do seu app

---

## 🔧 Variáveis de Ambiente

Não é necessário adicionar variáveis de ambiente no Next.js. O Supabase gerencia tudo internamente.

Mas certifique-se de que estas variáveis estão configuradas:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[SEU-PROJETO].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

---

## ✅ Verificação

Após configurar, você deve conseguir:

1. ✅ Ver "Google" como provider ativo no Supabase
2. ✅ Fazer login com Google no seu app
3. ✅ Ver usuários criados em "Authentication" → "Users"

---

## 🐛 Troubleshooting

### Erro: "redirect_uri_mismatch"
- Verifique se a URL de callback está correta no Google Cloud Console
- Certifique-se de que a URL no Supabase está correta

### Erro: "invalid_client"
- Verifique se o Client ID e Secret estão corretos
- Certifique-se de que copiou sem espaços extras

### Usuário não é criado após login
- Verifique os triggers no Supabase (devem criar profile automaticamente)
- Verifique os logs em "Authentication" → "Logs"

---

## 📝 Próximos Passos

Após configurar:
1. ✅ Testar login com Google
2. ✅ Verificar criação automática de profile
3. ✅ Implementar interface de login no app

---

**Última atualização**: Guia de configuração inicial

