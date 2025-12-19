# 🎨 Editor de Landing Page / Comparador de Produtos

> Sistema completo para criar e gerenciar Landing Pages personalizadas e comparar produtos de forma visual e interativa

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-3ecf8e)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Sobre o Projeto

Este é um **sistema completo de Editor de Landing Pages e Comparador de Produtos** desenvolvido com as melhores tecnologias do mercado. Permite criar landing pages personalizadas com múltiplos layouts, gerenciar catálogos de produtos, comparar produtos de forma visual e criar páginas de suporte/manuais.

**🎯 Perfeito para:**
- Agências de marketing digital
- E-commerces que precisam de landing pages personalizadas
- Empresas que vendem produtos comparáveis
- Projetos que precisam ser replicados para múltiplos clientes
- Campanhas de marketing com múltiplas versões

### 🎯 Principais Destaques

- 🎨 **Editor Visual de Landing Pages** - Crie landing pages sem código
- 📊 **Comparador de Produtos** - Compare produtos lado a lado com tópicos customizáveis
- 📱 **100% Responsivo** - Funciona perfeitamente em todos os dispositivos
- 🎛️ **Dashboard Admin** - Gerenciamento completo via interface visual
- 🎭 **Múltiplos Layouts** - Layout Padrão, Apple Watch e mais
- 📹 **Upload de Vídeos** - Suporte para vídeos verticais e horizontais
- 📚 **Catálogos de Produtos** - Crie catálogos personalizados com categorias
- 📖 **Páginas de Suporte** - Crie manuais e guias para produtos
- 📈 **Analytics Integrado** - Acompanhe performance das landing pages

---

## 🚀 Início Rápido

### ⚡ 5 Minutos para Rodar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
cp .env.example .env.local
# Preencha as credenciais do Supabase

# 3. Rodar o projeto
npm run dev

# 4. Abrir no navegador
http://localhost:3000
```

### 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| **[REPLICACAO_PROJETO.md](REPLICACAO_PROJETO.md)** | 📋 **Guia completo de replicação** - Configure tudo do zero |

---

## 🎨 Funcionalidades Principais

### 🎨 Editor de Landing Pages

- ✅ **Múltiplos Layouts** - Layout Padrão, Apple Watch e mais
- ✅ **Editor Visual** - Configure seções, cores, textos e imagens
- ✅ **Versões de Campanha** - Crie múltiplas versões da mesma landing page
- ✅ **Preview em Tempo Real** - Veja as mudanças antes de publicar
- ✅ **Analytics Integrado** - Acompanhe visualizações, cliques e conversões
- ✅ **Vídeos com Orientação** - Suporte para vídeos verticais e horizontais
- ✅ **Cronômetros** - Adicione contagem regressiva para promoções
- ✅ **Seções Modulares** - Hero, Produtos, Vídeo, FAQ, Sobre Nós e mais

### 📊 Comparador de Produtos

- ✅ **Comparação Visual** - Compare produtos lado a lado
- ✅ **Tópicos Customizáveis** - Defina quais características comparar
- ✅ **Links Salvos** - Crie links de comparação pré-definidos
- ✅ **Responsivo** - Funciona perfeitamente em mobile

### 📚 Catálogos de Produtos

- ✅ **Catálogos Personalizados** - Crie catálogos com layout próprio
- ✅ **Categorias** - Organize produtos por categorias
- ✅ **Produtos em Destaque** - Destaque produtos específicos
- ✅ **Temas Customizáveis** - Personalize cores e estilos

### 📖 Páginas de Suporte

- ✅ **Manuais e Guias** - Crie páginas de suporte para produtos
- ✅ **Passo a Passo** - Crie tutoriais com múltiplos passos
- ✅ **Vídeos e Imagens** - Adicione conteúdo multimídia
- ✅ **Navegação por Modelo** - Organize por modelo de produto

---

## 🛠️ Stack Tecnológica

### Frontend
```
Next.js 14      React 18      TypeScript
Tailwind CSS    Framer Motion    Lucide Icons
```

### Backend
```
Supabase (PostgreSQL + Auth + Storage)
Next.js API Routes
Row Level Security (RLS)
```

### Gerenciamento de Estado
```
Zustand (Estado Global)
React Hooks
Context API
```

### Integrações
```
Cloudinary (Upload de Imagens/Vídeos)
```

---

## 📁 Estrutura do Projeto

```
landing-page-editor/
├── 📚 Documentação
│   ├── README.md              Este arquivo
│   └── REPLICACAO_PROJETO.md  Guia completo de replicação
│
├── 🗄️ supabase/
│   ├── schema_completo_landing_editor.sql    Script completo do banco de dados
│   └── setup_storage_policies_landing_editor.sql  Políticas de storage
│
├── 📱 src/
│   ├── app/                   Páginas (App Router)
│   │   ├── page.tsx          Landing Page
│   │   ├── lp/               Landing Pages públicas
│   │   ├── comparar/         Comparador de produtos
│   │   ├── catalogo/         Catálogos de produtos
│   │   ├── suporte/          Páginas de suporte
│   │   └── dashboard/        Admin
│   │
│   ├── components/           Componentes
│   │   ├── ui/              Botões, Inputs, VideoUploader
│   │   ├── landing/         Seções de Landing Page
│   │   ├── catalog/         Componentes de Catálogo
│   │   └── layout/          Header, Footer
│   │
│   ├── lib/                 Bibliotecas
│   │   ├── supabase/       Cliente
│   │   └── utils/          Utilitários
│   │
│   ├── hooks/              React Hooks
│   └── types/              TypeScript Types
│
└── 📄 Configuração
    ├── package.json
    ├── .env.example         Template de variáveis
    ├── tsconfig.json
    ├── tailwind.config.js
    └── next.config.js
```

---

## 🗄️ Banco de Dados

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Usuários e perfis |
| `products` | Catálogo de produtos |
| `product_colors` | Variações de cor |
| `landing_layouts` | Layouts principais de landing pages |
| `landing_versions` | Versões/campanhas de landing pages |
| `landing_analytics` | Analytics e tracking |
| `product_comparisons` | Dados de comparação de produtos |
| `saved_comparisons` | Links de comparação salvos |
| `product_support_pages` | Páginas de suporte/manuais |
| `product_catalogs` | Catálogos de produtos |
| `site_settings` | Configurações globais |
| `site_terms` | Termos e políticas |

### Buckets de Storage

- **products** - Imagens de produtos
- **banners** - Banners da landing page
- **profiles** - Fotos de perfil
- **videos** - Vídeos para landing pages e suporte

---

## ⚙️ Configuração

### 1️⃣ Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Cloudinary (Upload de Imagens/Vídeos)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-api-key
CLOUDINARY_API_SECRET=seu-api-secret

# Configurações
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Nome da Sua Empresa
```

### 2️⃣ Banco de Dados

```bash
# Execute no SQL Editor do Supabase
# Use o arquivo: supabase/schema_completo_landing_editor.sql
```

📋 **Veja o guia completo**: [REPLICACAO_PROJETO.md](REPLICACAO_PROJETO.md)

### 3️⃣ Storage

Crie 4 buckets **públicos**:
- products
- banners
- profiles
- videos

---

## 🚀 Deploy

### Build
```bash
npm run build
```

### Plataformas Suportadas
- ✅ **Vercel** (Recomendado) - Veja guia completo em [REPLICACAO_PROJETO.md](REPLICACAO_PROJETO.md#7-deploy)
- ✅ Netlify
- ✅ VPS próprio
- ✅ Qualquer plataforma com suporte a Node.js

---

## 🔄 Replicação e Personalização

Este sistema foi projetado para ser facilmente replicado e personalizado para diferentes empresas e negócios.

### Como Replicar
1. Siga o guia completo em **[REPLICACAO_PROJETO.md](REPLICACAO_PROJETO.md)**
2. Configure as variáveis de ambiente
3. Execute o SQL completo
4. Personalize cores, textos e imagens
5. Configure integrações (Cloudinary, etc.)

### Personalização Rápida
- **Cores**: Configure no dashboard ou edite `tailwind.config.js`
- **Textos**: Edite via dashboard ou diretamente no banco de dados
- **Imagens**: Upload via dashboard ou Cloudinary
- **Funcionalidades**: Código modular facilita adicionar/remover features

---

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

## 🆘 Suporte

### Documentação
- [REPLICACAO_PROJETO.md](REPLICACAO_PROJETO.md) - Guia completo de configuração e replicação

### Problemas Comuns
Consulte a seção de troubleshooting em [REPLICACAO_PROJETO.md](REPLICACAO_PROJETO.md#-troubleshooting)

---

## 🛠️ Tecnologias Utilizadas

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Supabase** - Backend completo (PostgreSQL + Auth + Storage)
- **Tailwind CSS** - Estilização utilitária
- **Framer Motion** - Animações
- **Cloudinary** - Upload e otimização de imagens/vídeos

---

## 🎉 Comece Agora!

```bash
# 1. Clone o repositório
git clone seu-repositorio
cd landing-page-editor

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 4. Execute o projeto
npm run dev
```

👉 **Leia o guia completo**: **[REPLICACAO_PROJETO.md](REPLICACAO_PROJETO.md)**

---

## 📋 Checklist de Configuração

Após clonar o projeto:

- [ ] Configurar Supabase (criar projeto e executar SQL)
- [ ] Configurar Cloudinary (para upload de imagens/vídeos)
- [ ] Configurar variáveis de ambiente
- [ ] Criar buckets no Supabase Storage
- [ ] Configurar primeiro administrador
- [ ] Personalizar textos e imagens
- [ ] Fazer deploy

**📖 Veja detalhes de cada passo em [REPLICACAO_PROJETO.md](REPLICACAO_PROJETO.md)**

---

**Editor de Landing Page / Comparador de Produtos** - Sistema completo para criar e gerenciar landing pages personalizadas
