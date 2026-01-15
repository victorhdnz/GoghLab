# 🎨 Gogh Lab - Guia de Migração do Banco de Dados

## 📋 Schema de Assinaturas e Agentes de IA

Este documento descreve as tabelas criadas para o sistema de assinaturas da Gogh Lab.

---

## 🗄️ Tabelas Criadas

### 1. `subscriptions`
Armazena as assinaturas dos usuários integradas com Stripe.

**Campos principais:**
- `user_id` - Referência ao usuário
- `stripe_customer_id` - ID do cliente no Stripe
- `stripe_subscription_id` - ID da assinatura no Stripe
- `plan_type` - 'essential' ou 'premium'
- `status` - Status da assinatura (active, canceled, past_due, etc)
- `current_period_start` / `current_period_end` - Período atual

**RLS:**
- Usuários veem apenas suas próprias assinaturas
- Admins veem todas as assinaturas
- Sistema pode gerenciar via webhooks

---

### 2. `subscription_benefits`
Armazena os benefícios entregues aos assinantes (Canva Pro, CapCut Pro).

**Campos principais:**
- `subscription_id` - Referência à assinatura
- `benefit_type` - 'canva_pro' ou 'capcut_pro'
- `access_url` - Link de acesso fornecido
- `access_credentials` - Credenciais em JSON (se necessário)
- `status` - pending, delivered, active, expired
- `delivered_by` - Admin que entregou o acesso

**RLS:**
- Usuários veem benefícios de suas assinaturas
- Admins gerenciam todos os benefícios

---

### 3. `courses`
Armazena os cursos educacionais da plataforma.

**Campos principais:**
- `title` - Título do curso
- `slug` - URL única do curso
- `description` - Descrição
- `thumbnail_url` - Imagem de capa
- `course_type` - 'canva', 'capcut', 'strategy', 'other'
- `modules` - Array JSON com módulos do curso
- `is_premium_only` - Se apenas Premium tem acesso

**Estrutura de `modules` (JSON):**
```json
[
  {
    "id": "modulo-1",
    "title": "Introdução ao Canva",
    "description": "...",
    "video_url": "https://...",
    "duration": 600,
    "order": 1
  }
]
```

**RLS:**
- Todos podem ver cursos ativos
- Apenas admins podem gerenciar

---

### 4. `course_progress`
Armazena o progresso dos usuários nos cursos.

**Campos principais:**
- `user_id` - Referência ao usuário
- `course_id` - Referência ao curso
- `module_id` - ID do módulo dentro do curso
- `completed` - Se o módulo foi concluído
- `progress_percentage` - Porcentagem de progresso (0-100)
- `time_watched` - Tempo assistido em segundos

**RLS:**
- Usuários gerenciam apenas seu próprio progresso
- Admins podem ver todo o progresso

---

### 5. `agent_conversations`
Armazena as conversas dos usuários com os agentes de IA.

**Campos principais:**
- `user_id` - Referência ao usuário
- `agent_type` - 'video', 'social' ou 'ads'
- `title` - Título da conversa
- `messages` - Array JSON com mensagens
- `metadata` - Metadados adicionais
- `is_archived` - Se a conversa está arquivada

**Estrutura de `messages` (JSON):**
```json
[
  {
    "role": "user",
    "content": "Preciso de ideias para vídeos",
    "timestamp": "2024-01-01T10:00:00Z",
    "attachments": []
  },
  {
    "role": "assistant",
    "content": "Aqui estão algumas ideias...",
    "timestamp": "2024-01-01T10:00:05Z"
  }
]
```

**RLS:**
- Usuários gerenciam apenas suas conversas
- Admins podem ver todas (para suporte)

---

## 🔧 Funções Úteis

### `has_active_subscription(user_id)`
Retorna `true` se o usuário tem assinatura ativa.

```sql
SELECT has_active_subscription('user-uuid-here');
```

### `has_premium_plan(user_id)`
Retorna `true` se o usuário tem plano Premium ativo.

```sql
SELECT has_premium_plan('user-uuid-here');
```

### `get_active_subscription(user_id)`
Retorna a assinatura ativa do usuário.

```sql
SELECT * FROM get_active_subscription('user-uuid-here');
```

---

## 🚀 Como Aplicar

1. Acesse o **SQL Editor** no Supabase Dashboard
2. Copie o conteúdo de `schema_gogh_lab_subscriptions.sql`
3. Cole e execute no SQL Editor
4. Verifique se todas as tabelas foram criadas:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('subscriptions', 'subscription_benefits', 'courses', 'course_progress', 'agent_conversations');
   ```

---

## ⚠️ Importante

- **RLS está habilitado** em todas as tabelas
- **Triggers automáticos** atualizam `updated_at`
- **Índices** criados para performance
- **Funções** disponíveis para verificar assinaturas

---

## 📝 Próximos Passos

Após aplicar este schema:
1. ✅ Testar criação de assinatura manual
2. ✅ Configurar webhooks do Stripe
3. ✅ Criar interface de cursos
4. ✅ Implementar chat com agentes

---

**Última atualização**: Criação do schema inicial

