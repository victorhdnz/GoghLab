# 🌐 Configurar Domínio goghlab.com.br na Vercel

Este guia explica como configurar o domínio `goghlab.com.br` na Vercel para que seu projeto funcione corretamente.

---

## 📋 Pré-requisitos

1. ✅ Conta na Vercel (gratuita)
2. ✅ Domínio `goghlab.com.br` comprado
3. ✅ Acesso ao gerenciador de domínio (onde você comprou o domínio)
4. ✅ Projeto já deployado na Vercel (ou vai fazer o deploy)

---

## 🚀 Passo a Passo

### 1. Acessar o Projeto na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Selecione seu projeto (ou crie um novo se ainda não tiver)
3. Vá em **"Settings"** (Configurações) no menu superior
4. Clique em **"Domains"** (Domínios) no menu lateral

---

### 2. Adicionar Domínio na Vercel

1. Na página de Domains, você verá um campo para adicionar domínio
2. Digite: `goghlab.com.br`
3. Clique em **"Add"** (Adicionar)

---

### 3. Configurar Nameservers (Opção Recomendada)

A Vercel recomenda usar os **Nameservers** deles para gerenciar o DNS automaticamente.

#### 3.1. Obter Nameservers da Vercel

Após adicionar o domínio, a Vercel mostrará os **Nameservers** que você precisa usar:

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**Anote esses valores!** (Podem variar, mas geralmente são esses)

#### 3.2. Configurar no Gerenciador de Domínio

1. Acesse o painel do seu **registrador de domínio** (onde você comprou o `goghlab.com.br`)
   - Exemplos: Registro.br, GoDaddy, Namecheap, etc.

2. Procure por **"DNS"**, **"Nameservers"** ou **"Servidores de Nome"**

3. Você verá opções como:
   - **"Usar nameservers padrão"** (do registrador)
   - **"Usar nameservers personalizados"** ← **ESCOLHA ESTA**

4. Cole os nameservers da Vercel:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

5. Salve as alterações

⚠️ **IMPORTANTE**: A propagação pode levar de **alguns minutos até 48 horas**, mas geralmente é rápida (15-30 minutos).

---

### 4. Alternativa: Configurar DNS Manualmente (Avançado)

Se preferir manter os nameservers do seu registrador, você pode configurar os registros DNS manualmente:

#### 4.1. Obter IP da Vercel

A Vercel não usa IPs fixos, então você precisa usar registros **CNAME** ou **ALIAS**.

#### 4.2. Configurar Registros DNS

No seu gerenciador de DNS, adicione:

**Para o domínio principal (goghlab.com.br):**
```
Tipo: A
Nome: @
Valor: 76.76.21.21
TTL: 3600
```

**Para www (www.goghlab.com.br):**
```
Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com
TTL: 3600
```

⚠️ **Nota**: A Vercel recomenda usar Nameservers (opção anterior) para melhor performance e atualizações automáticas.

---

### 5. Verificar Configuração na Vercel

1. Volte para a página **"Domains"** na Vercel
2. Você verá o status do domínio:
   - 🟡 **"Pending"** (Pendente) - Aguardando propagação DNS
   - 🟢 **"Valid"** (Válido) - Configurado corretamente
   - 🔴 **"Invalid"** (Inválido) - Erro na configuração

3. Clique no domínio para ver detalhes e instruções específicas

---

### 6. Configurar SSL (Automático)

A Vercel configura o **SSL/HTTPS automaticamente** quando o domínio é validado. Não é necessário fazer nada!

Você verá um certificado Let's Encrypt sendo gerado automaticamente.

---

### 7. Configurar Variáveis de Ambiente (Importante!)

Após o domínio estar configurado, atualize as variáveis de ambiente:

1. Na Vercel, vá em **"Settings"** → **"Environment Variables"**
2. Adicione/Atualize:
   ```
   NEXT_PUBLIC_SITE_URL=https://goghlab.com.br
   ```
3. Clique em **"Save"**
4. **Faça um novo deploy** para aplicar as mudanças

---

## ✅ Verificação Final

Após a propagação DNS (pode levar até 48h, mas geralmente é rápido):

1. ✅ Acesse `https://goghlab.com.br` no navegador
2. ✅ Deve carregar seu site
3. ✅ Deve mostrar o cadeado verde (HTTPS ativo)
4. ✅ Teste `https://www.goghlab.com.br` (deve redirecionar para sem www)

---

## 🐛 Troubleshooting

### Domínio não está funcionando

1. **Verifique a propagação DNS:**
   - Use [whatsmydns.net](https://www.whatsmydns.net)
   - Digite `goghlab.com.br`
   - Verifique se os nameservers estão propagados

2. **Verifique na Vercel:**
   - Vá em "Domains" → Clique no domínio
   - Veja se há erros ou instruções específicas

3. **Aguarde a propagação:**
   - Pode levar até 48 horas (mas geralmente é rápido)
   - Limpe o cache do navegador (Ctrl+Shift+R)

### Erro "Invalid Configuration"

1. Verifique se os nameservers estão corretos
2. Verifique se salvou as alterações no gerenciador de domínio
3. Aguarde alguns minutos e verifique novamente

### SSL não está funcionando

1. Aguarde alguns minutos após o domínio ser validado
2. A Vercel gera o certificado automaticamente
3. Se não funcionar após 1 hora, entre em contato com o suporte da Vercel

---

## 📝 Checklist

- [ ] Domínio adicionado na Vercel
- [ ] Nameservers configurados no registrador
- [ ] Status do domínio mostra "Valid" na Vercel
- [ ] SSL/HTTPS ativo (cadeado verde)
- [ ] Variável `NEXT_PUBLIC_SITE_URL` configurada
- [ ] Novo deploy feito após configurar variáveis
- [ ] Site acessível em `https://goghlab.com.br`
- [ ] `www.goghlab.com.br` redireciona para `goghlab.com.br`

---

## 🎯 Próximos Passos

Após configurar o domínio:

1. ✅ Configurar Google OAuth (usando `goghlab.com.br`)
2. ✅ Configurar Stripe (usando o domínio de produção)
3. ✅ Testar todas as funcionalidades

---

## 📚 Recursos Úteis

- [Documentação Vercel - Domains](https://vercel.com/docs/concepts/projects/domains)
- [Verificar propagação DNS](https://www.whatsmydns.net)
- [Suporte Vercel](https://vercel.com/support)

---

**Última atualização**: Guia de configuração de domínio

