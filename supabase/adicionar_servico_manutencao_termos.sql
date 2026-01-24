-- ==========================================
-- ADICIONAR SERVIÇO DE MANUTENÇÃO NOS TERMOS
-- ==========================================
-- Este script adiciona o serviço "Manutenção e Alteração em sites existentes"
-- na seção 2.5 dos Termos de Serviços Personalizados
-- ==========================================
-- INSTRUÇÕES: Execute este script no SQL Editor do Supabase Dashboard
-- ==========================================

UPDATE public.site_terms
SET content = REPLACE(
  content,
  '### 2.4. Gestão de Redes Sociais
- Criação de calendário editorial
- Postagem e agendamento de conteúdo
- Interação com a audiência
- Monitoramento e relatórios de engajamento

## 3. Contratação e Seleção de Serviços',
  '### 2.4. Gestão de Redes Sociais
- Criação de calendário editorial
- Postagem e agendamento de conteúdo
- Interação com a audiência
- Monitoramento e relatórios de engajamento

### 2.5. Manutenção e Alteração em Sites Existentes
- Manutenção, correções, e adição em sites existentes
- Atualizações de conteúdo e funcionalidades
- Correção de bugs e problemas técnicos
- Melhorias e otimizações contínuas

## 3. Contratação e Seleção de Serviços'
)
WHERE key = 'termos-servicos'
  AND content NOT LIKE '%### 2.5. Manutenção e Alteração em Sites Existentes%';

-- Verificar se a atualização foi bem-sucedida
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  IF updated_count > 0 THEN
    RAISE NOTICE '✓ Seção 2.5 adicionada com sucesso aos Termos de Serviços Personalizados.';
  ELSE
    RAISE NOTICE 'ℹ A seção 2.5 já existe ou o termo não foi encontrado.';
  END IF;
END $$;

