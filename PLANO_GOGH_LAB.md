# 🎨 Gogh Lab - Plano de Implementação e Estrutura

## 📊 CÁLCULO DE CUSTOS E PREÇOS

### Custos Mensais Estimados

| Item | Custo Mensal | Observações |
|------|--------------|-------------|
| **Vercel (Hosting)** | $0-20 | Plano Hobby (gratuito até certo limite) ou Pro |
| **Supabase** | $0-25 | Plano Free ou Pro (depende do uso) |
| **Cloudinary** | $0-89 | Plano Free (25 créditos) ou Plus ($89/mês) |
| **Make.com** | $9-29 | Plano Core ($9) ou Pro ($29) |
| **OpenAI API** | $50-200 | Depende do uso (GPT-4 é caro, ~$0.03/1K tokens) |
| **Stripe** | 2.9% + R$0.40 | Taxa por transação (sem custo fixo) |
| **Canva Pro** | R$50-80 | Por assinante (custo variável) |
| **CapCut Pro** | R$30-50 | Por assinante (custo variável) |
| **Google OAuth** | $0 | Gratuito |
| **Total Operacional** | ~$100-400 | Sem contar Canva/CapCut por assinante |

### Cálculo por Assinante (Plano Premium)

| Item | Custo |
|------|-------|
| Canva Pro | R$ 60 |
| CapCut Pro | R$ 40 |
| **Total por assinante Premium** | **R$ 100** |

---

## 💰 PLANOS DE ASSINATURA PROPOSTOS

### Plano 1: **Essencial**
**Preço Mensal:** R$ 97/mês  
**Preço Anual:** R$ 970/ano (17% desconto = R$ 80,83/mês)

**Inclui:**
- ✅ Acesso a todos os 3 agentes de IA
  - Agente de Conteúdo em Vídeo
  - Agente de Conteúdos Escritos e Redes Sociais
  - Agente de Anúncios e Performance
- ✅ Suporte via chat
- ✅ Histórico de conversas
- ✅ Upload de imagens e documentos

**NÃO inclui:**
- ❌ Cursos de edição
- ❌ Acesso a Canva Pro
- ❌ Acesso a CapCut Pro

**Margem estimada:** ~70-75% (após custos operacionais)

---

### Plano 2: **Premium**
**Preço Mensal:** R$ 297/mês  
**Preço Anual:** R$ 2.970/ano (17% desconto = R$ 247,50/mês)

**Inclui:**
- ✅ Tudo do plano Essencial
- ✅ Cursos completos de edição
  - Curso de Canva (5 módulos)
  - Curso de CapCut (5 módulos)
  - Estratégias de conteúdo
  - Guias e materiais
- ✅ Acesso a Canva Pro (conta compartilhada)
- ✅ Acesso a CapCut Pro (conta compartilhada)
- ✅ Suporte prioritário

**Custo por assinante:** R$ 100 (Canva + CapCut)  
**Margem estimada:** ~60-65% (após custos operacionais + Canva/CapCut)

---

## 🎯 JUSTIFICATIVA DOS PREÇOS

### Plano Essencial (R$ 97/mês)
- **Custo operacional por usuário:** ~R$ 20-30/mês (IA + infraestrutura)
- **Margem:** ~R$ 67-77/mês (70-80%)
- **Posicionamento:** Acessível, para quem quer começar

### Plano Premium (R$ 297/mês)
- **Custo operacional:** ~R$ 20-30/mês (IA + infraestrutura)
- **Custo Canva/CapCut:** R$ 100/mês por assinante
- **Total custo:** ~R$ 120-130/mês
- **Margem:** ~R$ 167-177/mês (56-60%)
- **Posicionamento:** Completo, para quem quer tudo

---

## 📋 ESTRUTURA DE IMPLEMENTAÇÃO

### FASE 1: Reestruturação Interna (Branding) ⏳ EM ANDAMENTO
- [x] Analisar estrutura atual
- [ ] Atualizar cores (amarelo girassol, preto, bege)
- [ ] Integrar logo Gogh Lab
- [ ] Atualizar nome em toda plataforma
- [ ] Atualizar CSS variables
- [ ] Atualizar componentes visuais

### FASE 2: Estrutura de Dados
- [ ] Criar tabela `subscriptions` no Supabase
- [ ] Criar tabela `user_subscriptions` (relacionamento)
- [ ] Criar tabela `subscription_benefits` (Canva/CapCut)
- [ ] Criar tabela `courses` e `course_progress`
- [ ] Criar tabela `agent_conversations` (histórico de chats)

### FASE 3: Autenticação
- [ ] Configurar Google OAuth no Supabase
- [ ] Criar página de login
- [ ] Implementar fluxo de autenticação
- [ ] Proteger rotas de assinantes

### FASE 4: Sistema de Assinatura (Stripe)
- [ ] Integrar Stripe Checkout
- [ ] Criar webhooks Stripe → Supabase
- [ ] Implementar portal do cliente
- [ ] Sistema de renovação/cancelamento

### FASE 5: Interface dos Agentes
- [ ] Criar componente de chat
- [ ] Integrar com Make.com (webhooks)
- [ ] Implementar upload de arquivos
- [ ] Sistema de histórico de conversas

### FASE 6: Área Educacional
- [ ] Criar estrutura de cursos
- [ ] Player de vídeo
- [ ] Sistema de progresso
- [ ] Organizar conteúdo inicial

### FASE 7: Entrega Canva/CapCut
- [ ] Criar área de entrega de acessos
- [ ] Sistema de envio de links (manual)
- [ ] Tutoriais de login
- [ ] Integração com WhatsApp (opcional)

### FASE 8: Configurações Externas
- [ ] Configurar domínio goghlab.com.br na Vercel
- [ ] Configurar Google Auth
- [ ] Configurar Make.com e fluxos de IA

---

## 🎨 IDENTIDADE VISUAL - GOGH LAB

### Paleta de Cores

```css
:root {
  /* Amarelo Girassol (cor predominante) */
  --gogh-yellow: #F7C948;
  --gogh-yellow-dark: #E5A800;
  --gogh-yellow-light: #FDE68A;
  
  /* Preto (contraste e ícones) */
  --gogh-black: #0A0A0A;
  --gogh-gray-dark: #1A1A1A;
  --gogh-gray: #2A2A2A;
  
  /* Bege/Off-white (fundos) */
  --gogh-beige: #F5F1E8;
  --gogh-beige-light: #FBF8F3;
  --gogh-white: #FFFFFF;
}
```

### Logo
- Formato: SVG (preferencial) ou PNG alta resolução
- Versões: Horizontal, vertical, ícone
- Cores: Amarelo + Preto sobre fundo bege

---

## 🔄 FLUXO DE ENTREGA CANVA/CAPCUT

### Processo Manual (Inicial)

1. **Usuário assina plano Premium**
2. **Webhook Stripe confirma pagamento**
3. **Sistema marca usuário como "aguardando acesso"**
4. **Admin recebe notificação** (email ou dashboard)
5. **Admin compra acesso** (Canva/CapCut)
6. **Admin envia link** via:
   - Dashboard interno (área de mensagens)
   - WhatsApp automatizado (via Make.com)
   - Email automatizado
7. **Usuário acessa área de tutoriais**
8. **Usuário faz login** usando tutorial

### Área de Tutoriais Necessária

- [ ] Página "Como acessar Canva Pro"
- [ ] Página "Como acessar CapCut Pro"
- [ ] Vídeos tutoriais (hosted no Supabase Storage)
- [ ] Screenshots passo a passo

---

## 📦 ESTRUTURA DE BANCO DE DADOS

### Tabelas Necessárias

```sql
-- Assinaturas
subscriptions (
  id UUID PRIMARY KEY,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  user_id UUID REFERENCES auth.users,
  plan_type TEXT, -- 'essential' | 'premium'
  status TEXT, -- 'active' | 'canceled' | 'past_due'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Benefícios entregues (Canva/CapCut)
subscription_benefits (
  id UUID PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions,
  benefit_type TEXT, -- 'canva_pro' | 'capcut_pro'
  access_url TEXT,
  access_credentials JSONB, -- {username, password} ou {link}
  delivered_at TIMESTAMP,
  delivered_by UUID, -- admin que entregou
  status TEXT -- 'pending' | 'delivered' | 'active'
)

-- Cursos
courses (
  id UUID PRIMARY KEY,
  title TEXT,
  description TEXT,
  slug TEXT UNIQUE,
  thumbnail_url TEXT,
  course_type TEXT, -- 'canva' | 'capcut' | 'strategy'
  modules JSONB, -- array de módulos
  created_at TIMESTAMP
)

-- Progresso do usuário nos cursos
course_progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  course_id UUID REFERENCES courses,
  module_id TEXT,
  completed BOOLEAN DEFAULT false,
  progress_percentage INTEGER,
  last_accessed TIMESTAMP,
  created_at TIMESTAMP
)

-- Conversas com agentes
agent_conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  agent_type TEXT, -- 'video' | 'social' | 'ads'
  messages JSONB, -- array de mensagens
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Validar preços dos planos
2. ⏳ Começar reestruturação de branding
3. ⏳ Criar estrutura de banco de dados
4. ⏳ Implementar autenticação
5. ⏳ Integrar Stripe
6. ⏳ Desenvolver interface dos agentes
7. ⏳ Criar área educacional
8. ⏳ Sistema de entrega Canva/CapCut

---

**Status:** Planejamento concluído. Aguardando validação para iniciar FASE 1.

