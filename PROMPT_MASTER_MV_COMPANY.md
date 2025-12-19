# 🚀 PROMPT MASTER - Adaptação do Projeto para MV Company

## CONTEXTO

Você está adaptando um projeto de **E-commerce Smart Time Prime** para a **MV Company**, uma prestadora de serviços digitais (criação de sites, tráfego pago, criação de conteúdo, gestão de redes sociais).

**IMPORTANTE:** Reutilize MÁXIMO possível do código existente. Apenas adapte o necessário. Não recrie componentes UI, editores ou hooks do zero.

---

## PASSO 1: SUBSTITUIÇÕES OBRIGATÓRIAS

Execute estas substituições em **TODOS** os arquivos do projeto:

1. `"Smart Time Prime"` → `"MV Company"`
2. `"smart-time-prime"` → `"mv-company"`
3. `smart-time-prime` → `mv-company` (em slugs, URLs, pastas)

**Arquivos prioritários:**
- `package.json` → `name: "mv-company"`
- `src/app/layout.tsx` → função `getSiteName()` default
- `src/components/layout/Header.tsx` → nome padrão
- `src/components/layout/Footer.tsx` → nome padrão
- `src/app/dashboard/page.tsx` → mensagem de boas-vindas
- `src/app/dashboard/configuracoes/page.tsx` → valores padrão
- Todos os componentes de landing (textos padrão)
- `src/app/manifest.ts` → nome
- `LICENSE` → copyright

---

## PASSO 2: EXECUTAR SCHEMA SQL

**ANTES DE CONTINUAR:** Execute o arquivo `supabase/schema_mv_company.sql` completo no SQL Editor do Supabase. Este arquivo contém:
- Todas as tabelas necessárias
- RLS policies
- Triggers e funções
- Índices
- Dados iniciais

**NÃO PULE ESTE PASSO.** O schema é fundamental para o funcionamento do sistema.

---

## PASSO 3: ESTRUTURA DE DADOS

O projeto original usa `products`, `landing_layouts`, `product_comparisons`. Você deve adaptar para:

- `services` (substitui `products`)
- `portfolio_layouts` (substitui `landing_layouts`)
- `company_comparisons` (substitui `product_comparisons`)
- `service_testimonials` (novo - avaliações)
- `portfolio_pages` (novo - páginas detalhadas)
- `portfolio_analytics` (substitui `landing_analytics`)

**Estrutura de `comparison_topics` no comparador:**
```json
[
  {
    "id": "uuid",
    "name": "Criação de Sites Responsivos",
    "mv_company": true,  // true = ✅ verde, false = ❌ vermelho
    "competitor": false
  }
]
```

---

## PASSO 4: PORTFOLIO PRINCIPAL (`/`)

Crie a página principal do portfolio com:

### 4.1. Estrutura
1. **Header** - Logo, menu, botão contato
2. **Hero Section** - Título, subtítulo, CTA, imagem/vídeo
3. **Grid de Serviços** - Cards com:
   - Imagem de capa
   - Título do serviço
   - Descrição curta (2-3 linhas)
   - Botão "Saber Mais" → `/portfolio/[slug]`
4. **Card de Comparador** - Card especial destacado:
   - Título: "Compare a MV Company com outras empresas"
   - Botão "Comparar Agora" → `/comparar`
   - Visual diferenciado
5. **Seção de Contato** - WhatsApp, Instagram, formulário
6. **Footer** - Logo, links, redes sociais

### 4.2. Componentes a Criar
- `src/components/portfolio/ServiceCard.tsx` - Card de serviço
- `src/components/portfolio/PortfolioHero.tsx` - Hero do portfolio
- `src/components/portfolio/ComparisonCard.tsx` - Card do comparador

### 4.3. Editor Visual
Crie um editor visual para o portfolio principal (similar ao editor de landing pages existente):
- `src/app/dashboard/portfolio/editor/page.tsx`
- Reutilize a estrutura do editor de landing pages
- Adapte as seções para portfolio

---

## PASSO 5: PÁGINAS DETALHADAS DE SERVIÇOS (`/portfolio/[slug]`)

Cada serviço deve ter uma página completa editável com:

1. **Hero Section** - Título, subtítulo, CTA, imagem/vídeo
2. **Descrição Detalhada** - Texto, benefícios, processo
3. **Seção de Vídeo** - Vídeo explicativo (reutilizar `VideoUploader`)
4. **Galeria** - Imagens de projetos (reutilizar componentes de carrossel)
5. **Avaliações** - Cards com depoimentos (foto, nome, empresa, rating, texto)
6. **Preços/Investimento** - Faixa de preço, tempo de entrega
7. **CTA Final** - Botão contato, formulário, links sociais
8. **Serviços Relacionados** - Cards de outros serviços

### Componentes a Criar
- `src/components/portfolio/ServiceHero.tsx`
- `src/components/portfolio/ServiceTestimonials.tsx` - Carrossel de avaliações
- `src/components/portfolio/ServiceGallery.tsx`
- `src/components/portfolio/RelatedServices.tsx`

### Editor Visual
Crie editor para páginas de serviços:
- `src/app/dashboard/portfolio/[id]/page.tsx`
- Reutilize estrutura do editor existente
- Adapte seções para serviços

---

## PASSO 6: COMPARADOR DE EMPRESAS

### 6.1. Adaptação
O comparador deve comparar **MV Company** vs **Empresa Fictícia** (apenas 2 colunas).

### 6.2. Estrutura
- Tabela com 3 colunas:
  - Coluna 1: Nome do tópico
  - Coluna 2: MV Company (✅ verde ou ❌ vermelho)
  - Coluna 3: Empresa Comparada (✅ ou ❌)
- Cabeçalho com logos
- Design limpo e profissional

### 6.3. Dashboard
- `src/app/dashboard/comparador/page.tsx` - Lista de comparações
- `src/app/dashboard/comparador/[id]/page.tsx` - Editor de comparação
- Interface para:
  - Criar/editar comparações
  - Definir nome da empresa comparada
  - Upload de logo
  - Criar/editar tópicos
  - Definir check/X para cada empresa

### 6.4. Componentes
- `src/components/comparador/CompanyComparison.tsx` - Componente principal
- `src/components/comparador/ComparisonTable.tsx` - Tabela de comparação

### 6.5. Página Pública
- `src/app/comparar/page.tsx` - Comparador principal
- `src/app/comparar/[slug]/page.tsx` - Comparação específica
- Banner promocional (se configurado)
- Footer customizável

**IMPORTANTE:** Reutilize a lógica do comparador existente, apenas adaptando para 2 empresas fixas.

---

## PASSO 7: DASHBOARD ADMINISTRATIVO

### 7.1. Novas Rotas
- `/dashboard/portfolio` - Lista de serviços (CRUD)
- `/dashboard/portfolio/[id]` - Editor de serviço
- `/dashboard/portfolio/editor` - Editor do portfolio principal
- `/dashboard/comparador` - Lista de comparações (adaptar existente)
- `/dashboard/comparador/[id]` - Editor de comparação
- `/dashboard/avaliacoes` - Gerenciar depoimentos (CRUD)
- `/dashboard/analytics` - Analytics adaptado

### 7.2. Menu de Navegação
Atualize o menu do dashboard para incluir:
- Portfolio
- Comparador
- Avaliações
- Analytics
- Configurações

---

## PASSO 8: SISTEMA DE AVALIAÇÕES

### 8.1. Dashboard
- `src/app/dashboard/avaliacoes/page.tsx`
- CRUD completo de depoimentos
- Associar avaliações a serviços
- Moderar avaliações (ativar/desativar)
- Upload de foto do cliente

### 8.2. Componente
- `src/components/portfolio/ServiceTestimonials.tsx`
- Carrossel de avaliações
- Exibir: foto, nome, empresa, rating (estrelas), texto

---

## PASSO 9: ANALYTICS

Adapte o analytics existente para:

### 9.1. Métricas do Portfolio
- Visualizações da página principal
- Visualizações por serviço
- Cliques em "Saber Mais"
- Cliques em contato
- Tempo na página
- Taxa de conversão

### 9.2. Métricas do Comparador
- Visualizações de comparações
- Compartilhamentos
- Cliques em CTA

### 9.3. Dashboard
- `src/app/dashboard/analytics/page.tsx`
- Gráficos e estatísticas
- Filtros por período
- Exportação de dados

**IMPORTANTE:** Reutilize a estrutura de analytics existente, adaptando os tipos de eventos.

---

## PASSO 10: COMPONENTES A REUTILIZAR (100%)

### 10.1. Componentes UI
- `ImageUploader` - Upload e crop de imagens
- `VideoUploader` - Upload de vídeos
- `ArrayImageManager` - Gerenciar múltiplas imagens
- `Button`, `Input`, `Textarea`, `Select`, etc.
- Todos em `src/components/ui/`

### 10.2. Hooks
- `useAuth` - Autenticação
- Hooks de Supabase
- Hooks de upload

### 10.3. Utilitários
- Funções de formatação
- Funções de validação
- Helpers do Supabase

### 10.4. Editor Visual
- Sistema de editor visual (manter estrutura, adaptar seções)
- Modais de upload
- Preview em tempo real

**NÃO RECRIE ESTES COMPONENTES. REUTILIZE.**

---

## PASSO 11: TIPOS TYPESCRIPT

Adicione em `src/types/index.ts`:

```typescript
export interface Service {
  id: string
  name: string
  slug: string
  short_description?: string
  full_description?: string
  category?: string
  tags?: string[]
  cover_image?: string
  images?: string[]
  video_url?: string
  price_range?: string
  delivery_time?: string
  is_featured: boolean
  is_active: boolean
  meta_title?: string
  meta_description?: string
  created_at: string
  updated_at: string
}

export interface ServiceTestimonial {
  id: string
  service_id?: string
  client_name: string
  client_company?: string
  client_photo?: string
  rating?: number
  testimonial_text: string
  is_featured: boolean
  is_active: boolean
  created_at: string
}

export interface CompanyComparison {
  id: string
  name: string
  slug: string
  logo?: string
  description?: string
  comparison_topics: ComparisonTopic[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ComparisonTopic {
  id: string
  name: string
  mv_company: boolean
  competitor: boolean
}

export interface PortfolioLayout {
  id: string
  name: string
  slug: string
  description?: string
  custom_url?: string
  theme_colors: Record<string, string>
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface PortfolioPage {
  id: string
  service_id: string
  slug: string
  title: string
  content: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}
```

---

## PASSO 12: STORAGE BUCKETS

Crie os seguintes buckets no Supabase Storage (públicos):
- `services` - Imagens de serviços
- `portfolio` - Imagens do portfolio
- `testimonials` - Fotos de clientes
- `comparisons` - Logos de empresas
- `banners` - Banners promocionais
- `videos` - Vídeos de serviços

---

## PASSO 13: REFERÊNCIA VISUAL

O usuário mencionou: https://escoladosnaturais.site/links/

Analise essa página para entender:
- Estrutura de cards de serviços
- Layout geral
- Navegação
- Design minimalista e profissional

Use como inspiração, mas adapte para o estilo da MV Company.

---

## CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Configuração Base
- [ ] Executar `supabase/schema_mv_company.sql`
- [ ] Substituir "Smart Time Prime" → "MV Company" em todos os arquivos
- [ ] Atualizar `package.json` (name: "mv-company")
- [ ] Configurar variáveis de ambiente
- [ ] Criar buckets de storage

### Fase 2: Portfolio
- [ ] Criar página principal (`/`) com grid de serviços
- [ ] Criar componente `ServiceCard`
- [ ] Criar página detalhada (`/portfolio/[slug]`)
- [ ] Criar editor visual para portfolio
- [ ] Criar editor visual para páginas de serviços
- [ ] Integrar sistema de avaliações

### Fase 3: Comparador
- [ ] Adaptar lógica para 2 empresas
- [ ] Criar interface de criação/edição
- [ ] Criar componente `ComparisonTable`
- [ ] Adaptar página pública
- [ ] Integrar banner e footer

### Fase 4: Dashboard
- [ ] Criar `/dashboard/portfolio`
- [ ] Criar `/dashboard/comparador` (adaptar existente)
- [ ] Criar `/dashboard/avaliacoes`
- [ ] Adaptar `/dashboard/analytics`
- [ ] Atualizar menu de navegação

### Fase 5: Testes
- [ ] Testar criação de serviços
- [ ] Testar editor visual
- [ ] Testar comparador
- [ ] Testar avaliações
- [ ] Testar responsividade

---

## OBSERVAÇÕES CRÍTICAS

1. **REUTILIZAÇÃO:** Reutilize MÁXIMO possível. Não recrie componentes UI, hooks ou utilitários.

2. **EDITOR VISUAL:** Mantenha a estrutura do editor existente. Apenas adapte as seções.

3. **RESPONSIVIDADE:** Garanta que tudo funcione em mobile, tablet e desktop.

4. **SEGURANÇA:** Mantenha todas as políticas RLS e validações.

5. **TYPESCRIPT:** Mantenha tipagem forte.

6. **PADRÕES:** Siga os padrões do projeto original (Cursor Rules).

---

## RESUMO EXECUTIVO

**FAZER:**
1. Substituir "Smart Time Prime" → "MV Company"
2. Executar schema SQL
3. Criar portfolio com cards de serviços
4. Criar páginas detalhadas editáveis
5. Adaptar comparador para 2 empresas
6. Integrar sistema de avaliações
7. Adaptar analytics
8. Reutilizar toda infraestrutura existente

**NÃO FAZER:**
1. Não recriar componentes UI
2. Não recriar sistema de editor
3. Não remover funcionalidades sem necessidade
4. Não quebrar autenticação/segurança

---

**Comece pelo schema SQL e substituições de texto. Depois siga a ordem dos passos.**

