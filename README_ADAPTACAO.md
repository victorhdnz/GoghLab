# 📚 Guia de Adaptação - MV Company

## 📁 Arquivos Essenciais

### 1. PROMPT_MASTER_MV_COMPANY.md ⭐
**Este é o arquivo principal para colar no chat do outro projeto.**

Contém todas as instruções detalhadas, passo a passo, para adaptar o projeto. É auto-suficiente e completo.

**Como usar:**
1. Abra o arquivo `PROMPT_MASTER_MV_COMPANY.md`
2. Copie TODO o conteúdo
3. Cole no chat do projeto que será adaptado
4. O desenvolvedor seguirá as instruções passo a passo

---

### 2. supabase/schema_mv_company.sql
**Schema SQL completo para executar no Supabase.**

Este arquivo contém:
- Todas as tabelas necessárias
- RLS policies
- Triggers e funções
- Índices para performance
- Dados iniciais

**Como usar:**
1. Abra o Supabase Dashboard
2. Vá em SQL Editor
3. Cole TODO o conteúdo do arquivo
4. Execute o script
5. Verifique se todas as tabelas foram criadas

**IMPORTANTE:** Execute este arquivo ANTES de começar a adaptação do código.

---

## 🚀 Como Começar

### Passo 1: Executar SQL
1. Crie um novo projeto no Supabase
2. Execute `supabase/schema_mv_company.sql` no SQL Editor
3. Verifique se todas as tabelas foram criadas

### Passo 2: Copiar Prompt
1. Abra `PROMPT_MASTER_MV_COMPANY.md`
2. Copie TODO o conteúdo
3. Cole no chat do projeto que será adaptado

### Passo 3: Seguir Instruções
O desenvolvedor seguirá o prompt passo a passo, começando pelas substituições de texto e depois implementando as funcionalidades.

---

## 📋 Checklist Rápido

- [ ] Executar `supabase/schema_mv_company.sql` no Supabase
- [ ] Copiar `PROMPT_MASTER_MV_COMPANY.md` para o chat
- [ ] Criar buckets de storage no Supabase
- [ ] Seguir instruções do prompt passo a passo

---

## ⚠️ Observações Importantes

1. **O SQL deve ser executado PRIMEIRO** - Sem o schema, nada funcionará
2. **O prompt master é auto-suficiente** - Contém todas as informações necessárias
3. **Reutilize máximo possível** - Não recrie componentes UI, hooks ou utilitários
4. **Siga a ordem dos passos** - O prompt está organizado em ordem lógica

---

## 🆘 Dúvidas?

Consulte:
- `PROMPT_MASTER_MV_COMPANY.md` - Instruções completas e detalhadas

---

**Boa sorte na adaptação! 🚀**

