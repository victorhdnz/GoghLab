# 🔍 Diagnóstico de Problemas com Supabase

Se as páginas estão travando ou não carregam, pode ser problema com o Supabase.

---

## 🧪 Teste Rápido

### 1. Testar Conexão com Supabase

Acesse esta URL no navegador:
```
https://goghlab.com.br/api/test-connection
```

Ou localmente:
```
http://localhost:3000/api/test-connection
```

**O que verificar:**
- ✅ `success: true` = Conexão funcionando
- ❌ `success: false` = Problema na conexão
- ⚠️ `TIMEOUT` = Query demorando mais de 5 segundos

---

## 🔧 Problemas Comuns e Soluções

### Problema 1: Queries Travando (Timeout)

**Sintomas:**
- Página carrega parcialmente
- Fica carregando infinitamente
- Console mostra "Timeout"

**Soluções:**
1. ✅ **Já implementado**: Timeouts de 3 segundos nas queries
2. Verificar se o Supabase está acessível
3. Verificar se há muitas queries simultâneas

---

### Problema 2: RLS (Row Level Security) Bloqueando

**Sintomas:**
- Queries retornam vazio mesmo com dados
- Erro "permission denied"
- Apenas algumas queries funcionam

**Solução:**
1. Verificar políticas RLS no Supabase Dashboard
2. Verificar se a tabela `site_settings` tem RLS habilitado
3. Se necessário, desabilitar RLS temporariamente para teste:
   ```sql
   ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;
   ```

---

### Problema 3: Tabela Não Existe ou Vazia

**Sintomas:**
- Queries retornam `null` ou `[]`
- Erro "relation does not exist"

**Solução:**
1. Verificar se a tabela `site_settings` existe:
   ```sql
   SELECT * FROM site_settings LIMIT 1;
   ```

2. Se não existir, criar registro padrão:
   ```sql
   INSERT INTO site_settings (key, site_name, site_description, contact_email)
   VALUES ('general', 'Gogh Lab', 'Plataforma inteligente e autônoma baseada em agentes de IA', 'contato.goghlab@gmail.com')
   ON CONFLICT (key) DO NOTHING;
   ```

---

### Problema 4: Variáveis de Ambiente Incorretas

**Sintomas:**
- Erro "Invalid API key"
- Erro de conexão

**Solução:**
1. Verificar variáveis na Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. Verificar se estão corretas no Supabase Dashboard

---

## 📋 Checklist de Diagnóstico

- [ ] Acessar `/api/test-connection` e ver resultado
- [ ] Verificar logs do Supabase Dashboard
- [ ] Verificar se tabela `site_settings` existe e tem dados
- [ ] Verificar políticas RLS da tabela `site_settings`
- [ ] Verificar variáveis de ambiente na Vercel
- [ ] Testar query direto no Supabase SQL Editor

---

## 🚨 Solução Rápida (Temporária)

Se o problema persistir, você pode temporariamente:

1. **Desabilitar RLS na tabela site_settings:**
   ```sql
   ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;
   ```

2. **Ou criar política permissiva:**
   ```sql
   CREATE POLICY "Allow public read access"
   ON site_settings FOR SELECT
   USING (true);
   ```

⚠️ **Atenção**: Isso é temporário apenas para diagnóstico. Reative o RLS depois.

---

## 📝 Informações para Debug

Se o problema persistir, colete:

1. **Resultado de `/api/test-connection`**
2. **Logs do Supabase Dashboard** (Logs → API)
3. **Erros do console do navegador**
4. **Status da tabela `site_settings`** (tem dados? RLS ativo?)

---

**Última atualização**: Guia de diagnóstico Supabase

