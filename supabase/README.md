# 📁 Arquivos SQL - Editor de Landing Page / Comparador de Produtos

## 🎯 Arquivos Principais (Use Estes)

### 1. `schema_completo_landing_editor.sql`
**✅ USE ESTE ARQUIVO PARA NOVOS PROJETOS**

Este é o arquivo SQL consolidado e completo que contém todas as tabelas necessárias para o Editor de Landing Page e Comparador de Produtos.

**O que contém:**
- Tabelas de usuários (profiles)
- Tabelas de produtos (products, product_colors)
- Tabelas de landing pages (landing_layouts, landing_versions, landing_analytics)
- Tabelas de comparação (product_comparisons, saved_comparisons)
- Tabelas de suporte (product_support_pages)
- Tabelas de catálogos (product_catalogs)
- Tabelas de configurações (site_settings, site_terms)
- Todas as políticas RLS (Row Level Security)
- Triggers e funções necessárias
- Índices para performance

**Como usar:**
1. Abra o SQL Editor no Supabase
2. Copie TODO o conteúdo deste arquivo
3. Cole e execute
4. Aguarde a conclusão

---

### 2. `setup_storage_policies_landing_editor.sql`
**✅ USE ESTE ARQUIVO PARA CONFIGURAR STORAGE**

Este arquivo configura as políticas de segurança (RLS) para os buckets de storage do Supabase.

**O que contém:**
- Políticas para bucket `products` (imagens de produtos)
- Políticas para bucket `banners` (banners de landing pages)
- Políticas para bucket `profiles` (fotos de perfil)
- Políticas para bucket `videos` (vídeos para landing pages)

**Como usar:**
1. Crie os buckets manualmente no Supabase Dashboard (Storage → New Bucket)
2. Execute este arquivo no SQL Editor
3. Verifique se as políticas foram aplicadas

---

### 3. `criar_usuario_admin.sql` (Opcional)

Este arquivo contém um exemplo de como criar um usuário administrador via SQL.

**Como usar:**
1. Crie o usuário no Supabase Dashboard (Authentication → Users → Add user)
2. Execute o SQL no arquivo substituindo o email pelo email do administrador
3. Ou use o método direto via SQL Editor (veja REPLICACAO_PROJETO.md)

---

## 🚀 Passo a Passo para Configurar um Novo Projeto

1. **Criar projeto no Supabase**
   - Acesse [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Aguarde a criação

2. **Executar SQL principal**
   - Vá em SQL Editor
   - Execute `schema_completo_landing_editor.sql`
   - Aguarde a conclusão

3. **Criar buckets de storage**
   - Vá em Storage
   - Crie os buckets: `products`, `banners`, `profiles`, `videos`
   - Marque todos como **públicos**

4. **Configurar políticas de storage**
   - Vá em SQL Editor
   - Execute `setup_storage_policies_landing_editor.sql`

5. **Configurar primeiro administrador**
   - Faça login no sistema
   - Execute no SQL Editor:
     ```sql
     UPDATE profiles
     SET role = 'admin'
     WHERE email = 'seu-email@exemplo.com';
     ```

6. **Pronto!** O projeto está configurado.

---

## 📋 Checklist de Configuração

- [ ] Projeto Supabase criado
- [ ] SQL principal executado (`schema_completo_landing_editor.sql`)
- [ ] Buckets criados (products, banners, profiles, videos)
- [ ] Políticas de storage configuradas (`setup_storage_policies_landing_editor.sql`)
- [ ] Primeiro administrador configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Cloudinary configurado

---

**Última atualização**: 2025

