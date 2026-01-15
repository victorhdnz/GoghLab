# 📋 Resumo Rápido - Configurar Google OAuth

Guia visual e direto para configurar Google OAuth em 2 lugares.

---

## 🎯 Onde Configurar

Você precisa configurar em **2 lugares**:

1. ✅ **Google Cloud Console** - Criar credenciais OAuth
2. ✅ **Supabase Dashboard** - Conectar as credenciais

---

## 📍 PASSO 1: Google Cloud Console

### O que fazer:
1. Criar credenciais OAuth 2.0
2. Adicionar URLs de redirecionamento
3. Copiar Client ID e Client Secret

### URLs para adicionar:
```
https://[SEU-ID].supabase.co/auth/v1/callback
https://goghlab.com.br/auth/callback
```

### O que você vai copiar:
- ✅ Client ID
- ✅ Client Secret

---

## 📍 PASSO 2: Supabase Dashboard

### O que fazer:
1. Habilitar provider Google
2. Colar Client ID e Client Secret (do Google Cloud)
3. Configurar URLs de redirecionamento

### URLs para adicionar:
```
https://goghlab.com.br/auth/callback
https://[SEU-ID].supabase.co/auth/v1/callback
```

### O que você vai usar:
- ✅ Client ID (copiado do Google Cloud)
- ✅ Client Secret (copiado do Google Cloud)

---

## 🔄 Fluxo Completo

```
1. Google Cloud Console
   ↓
   Criar credenciais OAuth
   ↓
   Adicionar URLs de callback
   ↓
   Copiar Client ID e Secret
   ↓
2. Supabase Dashboard
   ↓
   Habilitar Google provider
   ↓
   Colar Client ID e Secret
   ↓
   Configurar URLs de callback
   ↓
3. Testar
   ↓
   Login funcionando! ✅
```

---

## ⚠️ Importante

- **Mesmo ID do Supabase** usado nos 2 lugares
- **Mesmas URLs** nos 2 lugares
- **Client ID e Secret** vêm do Google Cloud e vão para o Supabase

---

## 📝 Checklist

### Google Cloud Console
- [ ] Projeto criado
- [ ] Google+ API habilitada
- [ ] Credenciais OAuth criadas
- [ ] URLs de callback adicionadas
- [ ] Client ID copiado
- [ ] Client Secret copiado

### Supabase Dashboard
- [ ] Provider Google habilitado
- [ ] Client ID colado
- [ ] Client Secret colado
- [ ] URLs de callback configuradas
- [ ] Site URL configurado

### Teste
- [ ] Login com Google testado
- [ ] Redirecionamento funcionando
- [ ] Profile criado automaticamente

---

**Última atualização**: Resumo visual da configuração

