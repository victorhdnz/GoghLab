# 📋 Plano de Transformação do Projeto

## 🎯 Objetivo
Transformar o e-commerce completo em um sistema focado em:
- **Landing Pages múltiplas e editáveis**
- **Comparador de produtos**
- **Páginas de suporte/manual por modelo**
- **Dashboard administrativo (acessível apenas por URL específica)**
- **Sistema de analytics/tracking**

---

## 📊 Estrutura do Banco de Dados

### 1. Layouts de Landing Page
- Múltiplos layouts simultâneos
- Cada layout com URL única (`/lp/[slug]`)
- Suporte a múltiplas versões/campanhas por layout

### 2. Versões/Campanhas
- Cada layout pode ter múltiplas versões
- Cada versão é uma campanha de marketing
- Tracking independente por versão

### 3. Analytics/Tracking
- Clicks em links
- Scroll depth (até onde o usuário vai)
- Tempo na página
- Taxa de rejeição
- Conversões (clicks em CTAs)

### 4. Comparador de Produtos
- Produtos específicos para comparação
- Tópicos de comparação customizáveis
- URL separada: `/comparador`

### 5. Páginas de Suporte/Manual
- Uma página por modelo de produto
- URL: `/suporte/[modelo-slug]`
- Conteúdo editável no dashboard

---

## 🗂️ Estrutura de Arquivos

### Novas Tabelas SQL
1. `landing_layouts` - Layouts principais
2. `landing_versions` - Versões/campanhas dentro de cada layout
3. `landing_analytics` - Dados de analytics
4. `product_comparisons` - Produtos para comparador
5. `product_support_pages` - Páginas de suporte/manual

### Novas Rotas
- `/lp/[slug]` - Landing page por layout
- `/lp/[slug]/[version]` - Versão específica de um layout
- `/admin` - Dashboard (URL específica, sem ícones visíveis)
- `/comparador` - Comparador de produtos
- `/suporte/[modelo-slug]` - Página de suporte por modelo

### Componentes a Remover
- Carrinho (`/carrinho`)
- Checkout (`/checkout`)
- Minha conta (`/minha-conta`)
- Pedidos e vendas (do dashboard)
- Sistema de login/cadastro (manter apenas para admin)

### Componentes a Manter/Adaptar
- Sistema de landing pages (expandir)
- Dashboard administrativo (adaptar)
- Comparador (já existe, adaptar)

---

## ✅ Checklist de Implementação

### Fase 1: Banco de Dados
- [ ] Criar tabela `landing_layouts`
- [ ] Criar tabela `landing_versions`
- [ ] Criar tabela `landing_analytics`
- [ ] Criar tabela `product_comparisons`
- [ ] Criar tabela `product_support_pages`
- [ ] Migrar dados existentes de `seasonal_layouts` para `landing_layouts`

### Fase 2: Rotas e Páginas
- [ ] Criar rota `/lp/[slug]` para layouts
- [ ] Criar rota `/lp/[slug]/[version]` para versões
- [ ] Criar rota `/admin` (proteger com middleware)
- [ ] Adaptar `/comparador` existente
- [ ] Criar rota `/suporte/[modelo-slug]`
- [ ] Remover rotas de e-commerce não utilizadas

### Fase 3: Dashboard Administrativo
- [ ] Remover ícones de acesso ao dashboard
- [ ] Criar acesso apenas por URL `/admin`
- [ ] Criar gerenciamento de layouts
- [ ] Criar gerenciamento de versões/campanhas
- [ ] Criar editor visual (fontes e cores)
- [ ] Criar página de analytics
- [ ] Criar gerenciamento de comparador
- [ ] Criar gerenciamento de páginas de suporte

### Fase 4: Analytics e Tracking
- [ ] Implementar tracking de clicks
- [ ] Implementar tracking de scroll depth
- [ ] Implementar tracking de tempo na página
- [ ] Criar dashboard de analytics
- [ ] Criar relatórios de performance

### Fase 5: Landing Page Apple
- [ ] Analisar design da Apple Watch
- [ ] Criar layout inspirado
- [ ] Implementar componentes necessários

### Fase 6: Limpeza
- [ ] Remover componentes de carrinho
- [ ] Remover componentes de checkout
- [ ] Remover sistema de pedidos
- [ ] Remover sistema de login público
- [ ] Limpar rotas não utilizadas
- [ ] Atualizar navegação

---

## 🔐 Segurança

- Dashboard acessível apenas por `/admin`
- Middleware de autenticação para `/admin/*`
- Remover todos os ícones/links visíveis para o dashboard
- Manter autenticação apenas para administradores

---

## 📝 Notas

- Manter estrutura de produtos para o comparador
- Manter sistema de imagens (Supabase Storage)
- Manter autenticação Google OAuth apenas para admin
- Remover integrações de pagamento (Stripe)
- Remover integrações de frete (Melhor Envio)

