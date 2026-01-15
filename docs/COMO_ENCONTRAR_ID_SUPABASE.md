# 🔍 Como Encontrar o ID do Projeto Supabase

Este guia mostra onde encontrar o ID do seu projeto Supabase para usar nas URLs de callback.

---

## 📍 Onde Encontrar

### Método 1: Dashboard do Supabase (Mais Fácil)

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto
4. No canto superior esquerdo, você verá o **nome do projeto**
5. Abaixo do nome, há uma URL que mostra o ID:
   ```
   https://[SEU-ID-AQUI].supabase.co
   ```
   
   **Exemplo:**
   ```
   https://abcdefghijklmnop.supabase.co
   ```
   
   Neste caso, `abcdefghijklmnop` é o seu ID do projeto.

---

### Método 2: Settings → API

1. No dashboard do Supabase, vá em **Settings** (ícone de engrenagem)
2. Clique em **API**
3. Na seção **"Project URL"**, você verá:
   ```
   https://[SEU-ID].supabase.co
   ```
4. Copie o ID que está entre `https://` e `.supabase.co`

---

### Método 3: Variáveis de Ambiente

Se você já tem as variáveis de ambiente configuradas:

1. Na Vercel: **Settings** → **Environment Variables**
2. Procure por `NEXT_PUBLIC_SUPABASE_URL`
3. O valor será algo como:
   ```
   https://abcdefghijklmnop.supabase.co
   ```
4. O ID é a parte entre `https://` e `.supabase.co`

**Exemplo:**
- URL completa: `https://abcdefghijklmnop.supabase.co`
- ID do projeto: `abcdefghijklmnop`

---

## 🎯 Como Usar

Depois de encontrar o ID, use assim:

### URL de Callback do Supabase:
```
https://[SEU-ID].supabase.co/auth/v1/callback
```

**Exemplo real:**
Se seu ID for `abcdefghijklmnop`, a URL será:
```
https://abcdefghijklmnop.supabase.co/auth/v1/callback
```

---

## 📝 Onde Você Vai Usar Isso

### 1. Google Cloud Console (OAuth)
Ao configurar as **URIs de redirecionamento autorizados**, adicione:
```
https://[SEU-ID].supabase.co/auth/v1/callback
https://goghlab.com.br/auth/callback
```

### 2. Supabase Dashboard
Na configuração de **Redirect URLs**, adicione:
```
https://goghlab.com.br/auth/callback
https://[SEU-ID].supabase.co/auth/v1/callback
```

---

## ⚠️ Importante

- O ID do projeto é **único** para cada projeto Supabase
- É uma string de letras e números (geralmente 20+ caracteres)
- Não confunda com o **nome do projeto** (que você escolheu)
- O ID aparece na URL do dashboard

---

## 🔍 Exemplo Visual

```
Dashboard do Supabase:
┌─────────────────────────────────────┐
│  🏠 Meu Projeto                     │
│  https://abc123xyz.supabase.co      │ ← ID: abc123xyz
│                                     │
│  [Settings] [API] [Database] ...   │
└─────────────────────────────────────┘
```

---

## ✅ Checklist

- [ ] Acessei o dashboard do Supabase
- [ ] Encontrei a URL do projeto
- [ ] Copiei o ID (parte entre https:// e .supabase.co)
- [ ] Usei o ID nas URLs de callback
- [ ] Testei se está funcionando

---

**Última atualização**: Guia para encontrar ID do projeto Supabase

