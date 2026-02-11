# Planejamento e viabilidade – Nova ótica Gogh Lab (estilo Higgsfield)

Documento de análise do plano de pivot para uma plataforma de geração de vídeo/imagem com múltiplas IAs, mantendo ferramentas e adaptando prompts, com foco em planejamento e viabilidade técnica/business.

---

## 1. Resumo do que você quer

| Área | Objetivo |
|------|----------|
| **Modelo** | Similar ao Higgsfield: várias APIs de IA para vídeo e imagem (OpenAI, Google, Grok etc.). |
| **Mantido** | Ferramentas (solicitar acesso por plano); parte de prompts adaptada; assinaturas Stripe. |
| **Removido/adaptado** | Algumas “ferramentas” que forem IAs; prompts prontos na nova ótica (roteiro, prompts para geração). |
| **Diferenciais** | “Van Gogh” (IA Gogh Lab) para roteiros, ideias de takes, planejamento de vídeo e geração de prompts; até 5 cenas; imagem de referência obrigatória + opcional final; seletor de duração e de IA. |
| **Nav** | Pricing; Contato/redes; **Botão central em destaque** → área de criação; Ferramentas (solicitar acesso); Gerenciar assinatura (Stripe). Responsivo: pill no mobile, topo no desktop. |
| **Segurança** | Área de criação e uso das IAs só para conta logada + plano pago. |

---

## 2. Viabilidade técnica (com base no código atual)

### 2.1 O que já existe e pode ser reaproveitado

- **Auth:** Supabase Auth (Google etc.), `AuthContext`, `hasActiveSubscription`.
- **Stripe:** Checkout, webhooks, portal do cliente (gerenciar assinatura).
- **Área membro:** `/membro` com layout próprio (sidebar, conta, ferramentas, cursos, prompts, agentes, serviços).
- **Ferramentas:** Solicitar acesso por plano, liberação em 24h, credenciais; dá para manter e só remover/ocultar as que virarem “IA”.
- **Agentes de IA:** Chat por agente (`/membro/agentes`, `/membro/agentes/chat/[conversationId]`); API em `/api/ai/chat`. Base boa para o “Van Gogh” (um agente especial que faz roteiro + prompts).
- **Prompts:** Listagem por categoria na área membro; dá para adaptar para “prompts para geração” e integrar com Van Gogh.
- **Homepage:** Seções editáveis pelo dashboard (homepage_content); dá para adicionar seções “IAs disponíveis”, “Exemplos de vídeos/imagens”, abas de criação (como links que levam à área de criação).
- **Header/Footer:** `Header.tsx` hoje esconde em `/`, `/comparar`, etc.; dá para trocar para um nav estilo Higgsfield (incluindo botão central e pill no mobile).

Conclusão: a base (auth, planos, área membro, agentes, homepage editável) suporta a nova ótica. O trabalho é **novo front (nav + hub de criação)**, **novas APIs de geração** e **regras de acesso/creditos**.

### 2.2 O que precisa ser criado ou alterado

| Bloco | O que fazer | Complexidade |
|-------|-------------|--------------|
| **Nav nova** | Header com: Pricing, Contato, **Criar (destaque)** → `/criar`, Ferramentas → `/membro/ferramentas`, Conta/Assinatura → `/membro/conta` ou Stripe portal. Pill no mobile, topo no desktop. | Média |
| **Página “Criar”** | Nova rota (ex.: `/criar` ou `/membro/criar`). Se for só logado+plano pago, faz mais sentido `/membro/criar`. Abas: Imagem, Vídeo, Roteiro, (Prompts), Van Gogh. Cada aba = formulário (prompt, referências, modelo, duração, etc.) + chamada à API correta. | Alta |
| **Sistema de créditos** | Definir se “créditos” são por plano (ex.: X gerações/mês) ou consumo real (custo por API). Se for por custo, precisa tabela de uso, limites por plano e possivelmente webhook/job para video (async). | Alta |
| **APIs de geração** | Integrar OpenAI (imagem, Sora quando disponível), Google (Gemini, Veo, Imagen/Nano Banana), Grok. Cada uma com endpoint, auth, formatos diferentes; algumas geração de vídeo são assíncronas (polling ou webhook). | Alta |
| **Van Gogh** | Agente especial: entrada (ideia de vídeo) → saída (roteiro completo, takes, prompts para as IAs de vídeo/imagem). Pode usar um LLM (Gemini/GPT) via API já existente ou nova; UI pode ser uma aba dentro de “Criar” ou um chat dedicado. | Média |
| **Referências e cenas** | Upload de imagem obrigatória (e opcional “final”); “até 5 cenas” = enviar 5 descrições ou 5 imagens conforme a API. Depende da documentação de cada provedor (Sora, Veo, etc.). | Média |
| **Segurança** | Garantir que rotas de criação e chamadas às APIs exijam `hasActiveSubscription` (e opcionalmente checagem de créditos). Middleware ou HOC nas rotas `/membro/criar` e validação nas API routes. | Média |
| **Homepage** | Seções: oferta de IAs, exemplos (vídeos/imagens), abas “Criar vídeo / Criar imagem / etc.” como preview (link para login/criar). Editor do dashboard já permite mostrar/ocultar e ordenar seções. | Baixa–média |

### 2.3 Riscos técnicos

- **Disponibilidade das APIs:** Sora (OpenAI) e Veo/Nano Banana (Google) podem ter lista de espera, limites ou preços altos; Grok idem. Sem acesso oficial, esse pilar do produto fica bloqueado.
- **Custo por uso:** Vídeo em especial costuma ser caro. Precisa modelo de créditos/planos que feche a conta (ex.: X minutos de vídeo ou X imagens por mês por faixa de plano).
- **Jobs assíncronos:** Geração de vídeo pode levar minutos. Precisa fila (ex.: Supabase Edge, Vercel background, ou serviço externo) + polling ou webhook + UI de “gerando…” e notificação.
- **Múltiplos provedores:** Manter N APIs (OpenAI, Google, Grok) com comportamentos diferentes aumenta complexidade de erro, fallback e manutenção.

---

## 3. Viabilidade de produto / negócio

- **Proposta de valor:** “Várias IAs de vídeo/imagem + ferramentas + Van Gogh (roteiro/prompts)” está clara e diferenciada em relação a só “ferramentas + cursos”.
- **Monetização:** Já existe assinatura Stripe e planos; falta só amarrar “créditos” ou “limites de geração” aos planos.
- **Conteúdo da homepage:** Mostrar IAs, exemplos e abas de criação (sem uso sem conta/plano) é coerente com Higgsfield e melhora conversão.

---

## 4. Ordem sugerida (fases) para não gastar esforço à toa

Sugestão de fases para você ir implementando (e usando crédito do Cursor em blocos menores):

1. **Fase 1 – Nav e estrutura**
   - Novo Header: Pricing, Contato, botão central “Criar”, Ferramentas, Conta/Assinatura.
   - Versão pill no mobile, topo no desktop.
   - Rota `/membro/criar` (ou `/criar` com redirect se não logado) com layout de abas (Imagem, Vídeo, Roteiro, Van Gogh) ainda só UI, sem chamar APIs reais.

2. **Fase 2 – Segurança e acesso**
   - Garantir que `/membro/criar` e chamadas de geração exijam login + plano pago.
   - (Opcional) Esboço de “créditos” por plano (ex.: campo no Supabase ou no Stripe metadata).

3. **Fase 3 – Uma API de imagem e uma de vídeo**
   - Escolher uma API de imagem (ex.: OpenAI DALL·E ou Google Imagen) e uma de vídeo (a que você tiver acesso primeiro).
   - Integrar na aba “Imagem” e “Vídeo” com prompt + imagem de referência (obrigatória onde a API permitir).
   - Se a API de vídeo for assíncrona, fluxo “enviar → polling → mostrar resultado”.

4. **Fase 4 – Van Gogh**
   - Agente “Van Gogh”: roteiro completo + ideias de takes + sugestão de prompts para as outras abas.
   - Usar um LLM (ex.: Gemini ou GPT) via sua API atual de chat ou nova rota; UI pode ser aba “Roteiro” ou “Van Gogh” no hub de criação.

5. **Fase 5 – Múltiplas IAs e UX estilo Higgsfield**
   - Seletor de modelo (trocar IA) e de duração (vídeo).
   - Suporte a “até 5 cenas” e imagem final opcional conforme documentação de cada API.
   - Mais provedores (Sora, Veo, Grok) conforme acesso e documentação.

6. **Fase 6 – Homepage e polish**
   - Seções na homepage: IAs disponíveis, galeria de exemplos, atalhos para abas de criação (levando para login/criar).
   - Ajustes de copy, ferramentas (remover as que viraram IA) e prompts na nova ótica.

---

## 5. O que você precisa ter em mãos

- **Documentação das APIs:** OpenAI (imagem, Sora quando houver), Google (Gemini, Veo, Imagen/Nano Banana), Grok (endpoints, auth, formatos de request/response, se é síncrono ou assíncrono).
- **Acesso e limites:** Contas/API keys e política de uso (rate limits, preço por segundo de vídeo / por imagem).
- **Decisão de créditos:** Por plano (ex.: 50 imagens + 5 min vídeo/mês) ou por consumo real; se for consumo, como cobrir custo (preço do plano vs uso médio).

---

## 6. Conclusão

- **Viabilidade técnica:** Sim. O projeto já tem auth, Stripe, área membro, agentes e homepage editável; o que falta é novo fluxo de “criação” (nav + página com abas), integrações com as APIs de geração, sistema de créditos/limites e o agente Van Gogh.
- **Viabilidade de produto:** A ideia é consistente e os diferenciais (Van Gogh, ferramentas junto, múltiplas IAs) fazem sentido.
- **Riscos:** Dependência de acesso e preço das APIs (Sora, Veo, Grok, etc.) e custo de vídeo; dá para mitigar começando por uma imagem + uma vídeo e expandindo depois.
- **Recomendação:** Fazer em fases (nav → segurança → 1 imagem + 1 vídeo → Van Gogh → múltiplas IAs e UX completa → homepage). Assim você valida cada etapa e distribui o uso de crédito do Cursor ao longo do tempo.

Se quiser, o próximo passo pode ser detalhar só a **Fase 1** (estrutura do Header e da página `/membro/criar` com abas) em tarefas concretas de código, para você ou eu implementarmos passo a passo.
