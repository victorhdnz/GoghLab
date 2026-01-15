# 🔧 Troubleshooting - Páginas Não Carregam

Se as páginas não estão carregando, siga estes passos:

---

## 🔍 Diagnóstico Rápido

### 1. Verificar se o Servidor Está Rodando

**Desenvolvimento local:**
```bash
npm run dev
```

Verifique se aparece:
```
✓ Ready in Xs
○ Local: http://localhost:3000
```

**Produção (Vercel):**
- Verifique se o deploy foi concluído
- Veja os logs na Vercel Dashboard

---

### 2. Limpar Cache e Rebuild

**Passo a passo:**

1. **Parar o servidor** (Ctrl+C)

2. **Limpar cache do Next.js:**
```bash
rm -rf .next
```
Ou no Windows PowerShell:
```powershell
Remove-Item -Recurse -Force .next
```

3. **Limpar node_modules e reinstalar (se necessário):**
```bash
rm -rf node_modules
npm install
```

4. **Rebuild:**
```bash
npm run build
```

5. **Iniciar servidor:**
```bash
npm run dev
```

---

### 3. Verificar Console do Navegador

1. Abra o DevTools (F12)
2. Vá na aba **Console**
3. Veja se há erros em vermelho
4. Vá na aba **Network**
5. Veja se há requisições falhando (status 4xx ou 5xx)

**Erros comuns:**
- `Failed to fetch` → Problema de conexão com Supabase
- `Module not found` → Import incorreto
- `Cannot read property` → Erro de JavaScript

---

### 4. Verificar Variáveis de Ambiente

Certifique-se de que todas as variáveis estão configuradas:

**Local (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://qutdejthpofutisspuai.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-aqui
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-chave
CLOUDINARY_API_SECRET=seu-secret
NEXT_PUBLIC_SITE_URL=https://goghlab.com.br
```

**Vercel (Production):**
- Settings → Environment Variables
- Verifique se todas estão configuradas

---

### 5. Verificar Logs do Servidor

**Desenvolvimento:**
- Veja o terminal onde `npm run dev` está rodando
- Procure por erros em vermelho

**Produção (Vercel):**
1. Vá em **Deployments**
2. Clique no último deploy
3. Veja os **Logs**
4. Procure por erros

---

### 6. Testar Páginas Específicas

Teste estas URLs uma por uma:

- `http://localhost:3000/` (Homepage)
- `http://localhost:3000/dashboard` (Dashboard)
- `http://localhost:3000/portfolio/[algum-slug]` (Página de serviço)

**Se uma funciona e outra não:**
- O problema é específico daquela página
- Verifique os imports e componentes daquela página

---

### 7. Verificar Build

Execute o build para ver se há erros:

```bash
npm run build
```

**Se o build falhar:**
- Corrija os erros mostrados
- Geralmente são erros de TypeScript ou imports

**Se o build passar mas a página não carrega:**
- Pode ser erro de runtime
- Verifique o console do navegador

---

## 🐛 Problemas Comuns e Soluções

### Problema: Página fica em branco

**Possíveis causas:**
1. Erro JavaScript não tratado
2. Componente retornando `null` ou `undefined`
3. Erro de import

**Solução:**
- Abra o console (F12)
- Veja os erros
- Verifique se todos os imports estão corretos

---

### Problema: Página fica carregando infinitamente

**Possíveis causas:**
1. Requisição ao Supabase travando
2. Loop infinito em `useEffect`
3. Problema de autenticação

**Solução:**
- Verifique o Network tab (F12 → Network)
- Veja se há requisições pendentes
- Verifique se o Supabase está acessível

---

### Problema: Erro 500 ou Internal Server Error

**Possíveis causas:**
1. Erro no servidor (server component)
2. Problema com cookies
3. Erro no Supabase

**Solução:**
- Verifique os logs do servidor
- Verifique se as variáveis de ambiente estão corretas
- Teste a conexão com Supabase

---

### Problema: Erro de "Dynamic server usage"

**Causa:**
- Página usando cookies mas tentando renderizar estaticamente

**Solução:**
- Adicione `export const dynamic = 'force-dynamic'` no topo da página
- Já foi adicionado nas páginas principais

---

## ✅ Checklist de Verificação

- [ ] Servidor está rodando (`npm run dev`)
- [ ] Cache limpo (`.next` deletado)
- [ ] Build passa sem erros (`npm run build`)
- [ ] Variáveis de ambiente configuradas
- [ ] Console do navegador sem erros críticos
- [ ] Network tab sem requisições falhando
- [ ] Supabase acessível
- [ ] Testado em modo anônimo (para descartar cache do navegador)

---

## 🚨 Se Nada Funcionar

1. **Verifique os logs completos:**
   - Terminal do servidor
   - Console do navegador
   - Logs da Vercel (se em produção)

2. **Teste em outro navegador:**
   - Chrome
   - Firefox
   - Edge

3. **Teste em modo anônimo:**
   - Descarta problemas de cache/extensões

4. **Verifique se o problema é específico:**
   - Todas as páginas não carregam?
   - Apenas algumas páginas?
   - Apenas em produção ou também local?

---

## 📝 Informações para Debug

Se o problema persistir, colete estas informações:

1. **Erro exato do console** (copie e cole)
2. **URL da página** que não carrega
3. **Status do servidor** (rodando? erro?)
4. **Screenshot** do erro (se houver)
5. **Logs do terminal** (últimas 20 linhas)

---

**Última atualização**: Guia de troubleshooting

