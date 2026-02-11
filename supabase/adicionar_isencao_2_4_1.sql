-- ==========================================
-- ADICIONAR CLÁUSULA DE ISENÇÃO NA SEÇÃO 2.4.1
-- ==========================================
-- Este script adiciona a cláusula de isenção após o texto IMPORTANTE
-- na seção 2.4.1. Período de Liberação
-- ==========================================
-- INSTRUÇÕES: Execute este script no SQL Editor do Supabase Dashboard
-- ==========================================

-- Verificar se a seção 2.4.1 existe no conteúdo
SELECT 
  key,
  title,
  CASE 
    WHEN content LIKE '%#### 2.4.1. Período de Liberação%' THEN '✓ Seção 2.4.1 encontrada'
    ELSE '✗ Seção 2.4.1 NÃO encontrada'
  END as status_secao,
  CASE 
    WHEN content LIKE '%ISENÇÃO DE RESPONSABILIDADE:%' THEN '✓ Cláusula de isenção já existe'
    ELSE '✗ Cláusula de isenção NÃO encontrada'
  END as status_isencao,
  SUBSTRING(
    content,
    POSITION('#### 2.4.1' IN content),
    LEAST(1000, LENGTH(content) - POSITION('#### 2.4.1' IN content) + 1)
  ) as preview_secao_2_4_1
FROM site_terms
WHERE key = 'termos-assinatura-planos';

-- Adicionar cláusula de isenção após o texto IMPORTANTE
-- Tentativa 1: Se o texto IMPORTANTE está na mesma linha ou próxima
UPDATE site_terms
SET 
  content = REPLACE(
    content,
    E'**IMPORTANTE:** Esta regra se aplica tanto para **compras iniciais** (primeira contratação de um plano) quanto para **renovações** (renovação automática ou manual da assinatura). Em ambos os casos, o período de espera de 8 dias é contado a partir da data de início do novo período de assinatura (current_period_start), garantindo que o direito de arrependimento seja respeitado em cada ciclo contratual.\n\n#### 2.4.2. Processo de Solicitação',
    E'**IMPORTANTE:** Esta regra se aplica tanto para **compras iniciais** (primeira contratação de um plano) quanto para **renovações** (renovação automática ou manual da assinatura). Em ambos os casos, o período de espera de 8 dias é contado a partir da data de início do novo período de assinatura (current_period_start), garantindo que o direito de arrependimento seja respeitado em cada ciclo contratual.\n\n**ISENÇÃO DE RESPONSABILIDADE:** Ao contratar qualquer plano de assinatura, você reconhece e aceita expressamente que o acesso às ferramentas profissionais (Canva Pro e CapCut Pro) estará disponível apenas a partir do oitavo dia após o início da sua assinatura (ou renovação), e que este período de espera é uma condição essencial do contrato, estabelecida para garantir o cumprimento do período de arrependimento previsto no CDC. Você concorda que não terá direito a qualquer tipo de compensação, reembolso parcial, desconto ou indenização em decorrência deste período de espera, e que esta condição não constitui falha na prestação do serviço ou descumprimento contratual por parte do Gogh Lab.\n\n#### 2.4.2. Processo de Solicitação'
  ),
  updated_at = NOW()
WHERE key = 'termos-assinatura-planos'
  AND content LIKE '%IMPORTANTE: Esta regra se aplica tanto para%'
  AND content NOT LIKE '%ISENÇÃO DE RESPONSABILIDADE:%'
  AND content LIKE '%#### 2.4.2. Processo de Solicitação%';

-- Tentativa 2: Se o formato está ligeiramente diferente (com quebras de linha diferentes)
UPDATE site_terms
SET 
  content = REGEXP_REPLACE(
    content,
    E'(\\*\\*IMPORTANTE:\\*\\*[^\\n]+\\n[^\\n]+\\n[^\\n]+\\n[^\\n]+garantindo que o direito de arrependimento seja respeitado em cada ciclo contratual\\.)(\\s*\\n\\s*)(#### 2\\.4\\.2\\. Processo de Solicitação)',
    E'\\1\\2\\n\\n**ISENÇÃO DE RESPONSABILIDADE:** Ao contratar qualquer plano de assinatura, você reconhece e aceita expressamente que o acesso às ferramentas profissionais (Canva Pro e CapCut Pro) estará disponível apenas a partir do oitavo dia após o início da sua assinatura (ou renovação), e que este período de espera é uma condição essencial do contrato, estabelecida para garantir o cumprimento do período de arrependimento previsto no CDC. Você concorda que não terá direito a qualquer tipo de compensação, reembolso parcial, desconto ou indenização em decorrência deste período de espera, e que esta condição não constitui falha na prestação do serviço ou descumprimento contratual por parte do Gogh Lab.\\2\\3',
    'g'
  ),
  updated_at = NOW()
WHERE key = 'termos-assinatura-planos'
  AND content LIKE '%IMPORTANTE: Esta regra se aplica tanto para%'
  AND content NOT LIKE '%ISENÇÃO DE RESPONSABILIDADE:%'
  AND content LIKE '%#### 2.4.2. Processo de Solicitação%';

-- Tentativa 3: Adicionar diretamente antes de "#### 2.4.2" se o IMPORTANTE estiver próximo
UPDATE site_terms
SET 
  content = REGEXP_REPLACE(
    content,
    E'(garantindo que o direito de arrependimento seja respeitado em cada ciclo contratual\\.)(\\s*\\n\\s*)(#### 2\\.4\\.2\\. Processo de Solicitação)',
    E'\\1\\2\\n\\n**ISENÇÃO DE RESPONSABILIDADE:** Ao contratar qualquer plano de assinatura, você reconhece e aceita expressamente que o acesso às ferramentas profissionais (Canva Pro e CapCut Pro) estará disponível apenas a partir do oitavo dia após o início da sua assinatura (ou renovação), e que este período de espera é uma condição essencial do contrato, estabelecida para garantir o cumprimento do período de arrependimento previsto no CDC. Você concorda que não terá direito a qualquer tipo de compensação, reembolso parcial, desconto ou indenização em decorrência deste período de espera, e que esta condição não constitui falha na prestação do serviço ou descumprimento contratual por parte do Gogh Lab.\\2\\3',
    'g'
  ),
  updated_at = NOW()
WHERE key = 'termos-assinatura-planos'
  AND content LIKE '%garantindo que o direito de arrependimento seja respeitado em cada ciclo contratual%'
  AND content NOT LIKE '%ISENÇÃO DE RESPONSABILIDADE:%'
  AND content LIKE '%#### 2.4.2. Processo de Solicitação%';

-- Verificar resultado final
SELECT 
  key,
  title,
  CASE 
    WHEN content LIKE '%#### 2.4.1. Período de Liberação%' THEN '✓ Seção 2.4.1 encontrada'
    ELSE '✗ Seção 2.4.1 NÃO encontrada'
  END as status_secao,
  CASE 
    WHEN content LIKE '%ISENÇÃO DE RESPONSABILIDADE:%' THEN '✓ Cláusula de isenção adicionada'
    ELSE '✗ Cláusula de isenção NÃO encontrada'
  END as status_isencao,
  -- Mostrar um trecho maior da seção 2.4.1 para verificar
  SUBSTRING(
    content,
    POSITION('#### 2.4.1' IN content),
    LEAST(1500, LENGTH(content) - POSITION('#### 2.4.1' IN content) + 1)
  ) as conteudo_secao_2_4_1,
  updated_at
FROM site_terms
WHERE key = 'termos-assinatura-planos';

