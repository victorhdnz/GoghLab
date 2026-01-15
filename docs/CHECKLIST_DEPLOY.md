# ✅ Checklist Completo - Deploy e Configuração Gogh Lab

Use este checklist para garantir que tudo está configurado corretamente antes de ir para produção.

---

## 🌐 1. DOMÍNIO E HOSTING

### Vercel
- [ ] Projeto criado na Vercel
- [ ] Repositório conectado (GitHub/GitLab)
- [ ] Deploy inicial realizado
- [ ] Domínio `goghlab.com.br` adicionado na Vercel
- [ ] Nameservers configurados no registrador
- [ ] Domínio validado na Vercel (status "Valid")
- [ ] SSL/HTTPS ativo (cadeado verde)
- [ ] Site acessível em `https://goghlab.com.br`

---

## 🔐 2. VARIÁVEIS DE AMBIENTE (Vercel)

Configure todas estas variáveis em **Settings → Environment Variables**:

### Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### Cloudinary
- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`

### Site
- [ ] `NEXT_PUBLIC_SITE_URL=https://goghlab.com.br`

### Google OAuth (quando configurar)
- [ ] Não precisa de variáveis (gerenciado pelo Supabase)

### Stripe (quando configurar)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

### Make.com (quando configurar)
- [ ] `MAKE_WEBHOOK_URL` (URL do webhook do Make.com)

---

## 🗄️ 3. BANCO DE DADOS (Supabase)

### Tabelas
- [ ] Tabela `profiles` existe
- [ ] Tabela `subscriptions` criada (schema_gogh_lab_subscriptions.sql)
- [ ] Tabela `subscription_benefits` criada
- [ ] Tabela `courses` criada
- [ ] Tabela `course_progress` criada
- [ ] Tabela `agent_conversations` criada

### Storage Buckets
- [ ] Bucket `videos` criado (público)
- [ ] Bucket `products` criado (público)
- [ ] Bucket `banners` criado (público)
- [ ] Bucket `profiles` criado (público)

### RLS (Row Level Security)
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas de segurança configuradas
- [ ] Testado acesso de usuários

---

## 🔑 4. AUTENTICAÇÃO

### Supabase Auth
- [ ] Autenticação habilitada
- [ ] Email/Password habilitado
- [ ] Google OAuth configurado
- [ ] URLs de callback configuradas:
  - [ ] `https://goghlab.com.br/auth/callback`
  - [ ] `https://[PROJETO].supabase.co/auth/v1/callback`

### Google Cloud Console
- [ ] Projeto criado no Google Cloud
- [ ] Google+ API habilitada
- [ ] Credenciais OAuth 2.0 criadas
- [ ] Client ID e Secret configurados no Supabase
- [ ] URLs de redirecionamento configuradas:
  - [ ] `https://[PROJETO].supabase.co/auth/v1/callback`
  - [ ] `https://goghlab.com.br/auth/callback`

---

## 💳 5. PAGAMENTOS (Stripe) - Quando implementar

- [ ] Conta Stripe criada
- [ ] Modo de teste configurado
- [ ] Produtos/Planos criados no Stripe
- [ ] Webhooks configurados:
  - [ ] `checkout.session.completed`
  - [ ] `invoice.paid`
  - [ ] `customer.subscription.deleted`
- [ ] Webhook endpoint configurado na Vercel
- [ ] Testado fluxo completo de assinatura

---

## 🤖 6. AUTOMAÇÕES (Make.com) - Quando implementar

- [ ] Conta Make.com criada
- [ ] Cenários criados:
  - [ ] Chat Agente Vídeo
  - [ ] Chat Agente Social Media
  - [ ] Chat Agente Ads
  - [ ] Processamento de Arquivos
- [ ] Webhooks configurados
- [ ] Integração com OpenAI/Anthropic configurada
- [ ] Testado envio de mensagens

---

## 🎨 7. BRANDING E CONTEÚDO

### Identidade Visual
- [ ] Logo adicionada (`public/logo.svg` ou `.png`)
- [ ] Favicon configurado
- [ ] Cores atualizadas (amarelo girassol, preto, bege)
- [ ] Nome "Gogh Lab" atualizado em toda plataforma

### Conteúdo
- [ ] Landing page atualizada
- [ ] Textos revisados
- [ ] Imagens otimizadas
- [ ] SEO básico configurado

---

## 🧪 8. TESTES

### Funcionalidades Básicas
- [ ] Site carrega corretamente
- [ ] Navegação funciona
- [ ] Responsivo (mobile/tablet/desktop)
- [ ] Performance aceitável

### Autenticação
- [ ] Login com email/senha funciona
- [ ] Login com Google funciona
- [ ] Logout funciona
- [ ] Profile criado automaticamente

### Banco de Dados
- [ ] Queries funcionam
- [ ] Uploads funcionam (imagens/vídeos)
- [ ] RLS funcionando corretamente

---

## 📊 9. MONITORAMENTO

- [ ] Analytics configurado (opcional)
- [ ] Error tracking configurado (opcional)
- [ ] Logs da Vercel monitorados
- [ ] Logs do Supabase monitorados

---

## 🔒 10. SEGURANÇA

- [ ] Variáveis de ambiente não expostas no código
- [ ] Service Role Key protegido (nunca no client)
- [ ] RLS configurado corretamente
- [ ] HTTPS forçado (automático na Vercel)
- [ ] CORS configurado (se necessário)

---

## 📝 11. DOCUMENTAÇÃO

- [ ] README atualizado
- [ ] Guias de configuração criados
- [ ] Documentação de API (se necessário)
- [ ] Changelog mantido

---

## 🚀 12. DEPLOY FINAL

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Build sem erros
- [ ] Testes passando
- [ ] Deploy em produção realizado
- [ ] Smoke tests após deploy
- [ ] Backup do banco de dados (opcional, mas recomendado)

---

## ✅ VALIDAÇÃO FINAL

Após completar tudo:

1. ✅ Acesse `https://goghlab.com.br`
2. ✅ Teste login com Google
3. ✅ Verifique se tudo está funcionando
4. ✅ Monitore por algumas horas
5. ✅ Pronto para produção! 🎉

---

**Última atualização**: Checklist completo de deploy

