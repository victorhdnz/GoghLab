-- ==========================================
-- ATUALIZAR TERMOS DE ASSINATURA - VERSÃO SIMPLES
-- ==========================================
-- Este script adiciona a cláusula de isenção e atualiza a política de reembolso
-- ==========================================
-- INSTRUÇÕES: Execute este script no SQL Editor do Supabase Dashboard
-- ==========================================

-- 1. Adicionar cláusula de isenção após o texto IMPORTANTE
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
  AND content NOT LIKE '%ISENÇÃO DE RESPONSABILIDADE:%';

-- 2. Atualizar política de reembolso
UPDATE site_terms
SET 
  content = REPLACE(
    content,
    E'- **Condições**: O reembolso total será processado apenas se solicitado dentro do período de arrependimento e se você não tiver utilizado recursos significativos do plano durante este período',
    E'- **Direito de Arrependimento**: Conforme o CDC, você tem direito ao reembolso total se solicitar o cancelamento dentro do período de arrependimento de 7 dias, independentemente do uso ou não dos recursos do plano durante este período. O direito de arrependimento é irrestrito e não requer justificativa.\n- **Processamento**: O reembolso total será processado quando solicitado dentro do período de arrependimento, respeitando o direito garantido pelo CDC'
  ),
  updated_at = NOW()
WHERE key = 'termos-assinatura-planos'
  AND content LIKE '%Condições: O reembolso total será processado apenas se solicitado dentro do período de arrependimento e se você não tiver utilizado recursos significativos%';

-- 3. Atualizar referência ao CDC para incluir Art. 49
UPDATE site_terms
SET 
  content = REPLACE(
    content,
    E'- **Período de Arrependimento**: 7 (sete) dias corridos a partir da data de contratação, conforme previsto no Código de Defesa do Consumidor (CDC)',
    E'- **Período de Arrependimento**: 7 (sete) dias corridos a partir da data de contratação, conforme previsto no Código de Defesa do Consumidor (CDC - Art. 49)'
  ),
  updated_at = NOW()
WHERE key = 'termos-assinatura-planos'
  AND content LIKE '%Período de Arrependimento: 7 (sete) dias corridos%'
  AND content NOT LIKE '%CDC - Art. 49%';

-- 4. Verificar resultado
SELECT 
  key,
  title,
  CASE 
    WHEN content LIKE '%ISENÇÃO DE RESPONSABILIDADE:%' THEN '✓ Cláusula de isenção presente'
    ELSE '✗ Cláusula de isenção NÃO encontrada'
  END as status_isencao,
  CASE 
    WHEN content LIKE '%Direito de Arrependimento: Conforme o CDC%' THEN '✓ Política de reembolso atualizada'
    ELSE '✗ Política de reembolso NÃO atualizada'
  END as status_reembolso,
  CASE 
    WHEN content LIKE '%CDC - Art. 49%' THEN '✓ Referência ao Art. 49 presente'
    ELSE '✗ Referência ao Art. 49 NÃO encontrada'
  END as status_art49,
  updated_at
FROM site_terms
WHERE key = 'termos-assinatura-planos';

