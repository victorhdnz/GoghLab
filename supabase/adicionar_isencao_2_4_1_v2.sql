-- ==========================================
-- ADICIONAR CLÁUSULA DE ISENÇÃO NA SEÇÃO 2.4.1 - VERSÃO 2
-- ==========================================
-- Este script primeiro mostra o conteúdo atual e depois adiciona a cláusula
-- ==========================================
-- INSTRUÇÕES: Execute este script no SQL Editor do Supabase Dashboard
-- ==========================================

-- PASSO 1: Ver o conteúdo atual da seção 2.4.1
SELECT 
  '=== CONTEÚDO ATUAL DA SEÇÃO 2.4.1 ===' as info,
  SUBSTRING(
    content,
    GREATEST(1, POSITION('#### 2.4.1' IN content) - 200),
    LEAST(2000, LENGTH(content) - GREATEST(1, POSITION('#### 2.4.1' IN content) - 200) + 1)
  ) as conteudo_secao_2_4_1
FROM site_terms
WHERE key = 'termos-assinatura-planos'
  AND content LIKE '%#### 2.4.1%';

-- PASSO 2: Verificar se já tem a cláusula de isenção
SELECT 
  '=== VERIFICAÇÃO ===' as info,
  CASE 
    WHEN content LIKE '%ISENÇÃO DE RESPONSABILIDADE:%' THEN '✓ Cláusula de isenção JÁ EXISTE'
    ELSE '✗ Cláusula de isenção NÃO encontrada - será adicionada'
  END as status
FROM site_terms
WHERE key = 'termos-assinatura-planos';

-- PASSO 3: Adicionar a cláusula (executa apenas se não existir)
DO $$
DECLARE
  v_content TEXT;
  v_updated BOOLEAN := FALSE;
  v_clausula_isencao TEXT := E'\n\n**ISENÇÃO DE RESPONSABILIDADE:** Ao contratar qualquer plano de assinatura, você reconhece e aceita expressamente que o acesso às ferramentas profissionais (Canva Pro e CapCut Pro) estará disponível apenas a partir do oitavo dia após o início da sua assinatura (ou renovação), e que este período de espera é uma condição essencial do contrato, estabelecida para garantir o cumprimento do período de arrependimento previsto no CDC. Você concorda que não terá direito a qualquer tipo de compensação, reembolso parcial, desconto ou indenização em decorrência deste período de espera, e que esta condição não constitui falha na prestação do serviço ou descumprimento contratual por parte do Gogh Lab.';
BEGIN
  -- Buscar conteúdo atual
  SELECT content INTO v_content
  FROM site_terms
  WHERE key = 'termos-assinatura-planos';
  
  -- Verificar se já tem a cláusula
  IF v_content NOT LIKE '%ISENÇÃO DE RESPONSABILIDADE:%' THEN
    -- Tentar diferentes padrões para encontrar onde inserir
    
    -- Padrão 1: Após "garantindo que o direito de arrependimento seja respeitado em cada ciclo contratual."
    IF v_content LIKE '%garantindo que o direito de arrependimento seja respeitado em cada ciclo contratual%' 
       AND v_content LIKE '%#### 2.4.2. Processo de Solicitação%' THEN
      
      v_content := REGEXP_REPLACE(
        v_content,
        E'(garantindo que o direito de arrependimento seja respeitado em cada ciclo contratual\\.)(\\s*\\n\\s*)(#### 2\\.4\\.2\\. Processo de Solicitação)',
        E'\\1' || v_clausula_isencao || E'\\2\\3',
        'g'
      );
      v_updated := TRUE;
      
    -- Padrão 2: Após o texto IMPORTANTE completo
    ELSIF v_content LIKE '%**IMPORTANTE:**%' 
          AND v_content LIKE '%#### 2.4.2. Processo de Solicitação%' THEN
      
      v_content := REGEXP_REPLACE(
        v_content,
        E'(\\*\\*IMPORTANTE:\\*\\*[^\\n]+\\n[^\\n]+\\n[^\\n]+\\n[^\\n]+garantindo que o direito de arrependimento seja respeitado em cada ciclo contratual\\.)(\\s*\\n\\s*)(#### 2\\.4\\.2\\. Processo de Solicitação)',
        E'\\1' || v_clausula_isencao || E'\\2\\3',
        'g'
      );
      v_updated := TRUE;
    END IF;
    
    -- Atualizar se houve mudança
    IF v_updated THEN
      UPDATE site_terms
      SET content = v_content, updated_at = NOW()
      WHERE key = 'termos-assinatura-planos';
      
      RAISE NOTICE '✓ Cláusula de isenção adicionada com sucesso!';
    ELSE
      RAISE NOTICE '⚠ Não foi possível encontrar o padrão para inserir a cláusula. Verifique o conteúdo manualmente.';
    END IF;
  ELSE
    RAISE NOTICE '✓ Cláusula de isenção já existe no conteúdo.';
  END IF;
END $$;

-- PASSO 4: Verificar resultado final
SELECT 
  '=== RESULTADO FINAL ===' as info,
  CASE 
    WHEN content LIKE '%ISENÇÃO DE RESPONSABILIDADE:%' THEN '✓✓✓ Cláusula de isenção ADICIONADA COM SUCESSO!'
    ELSE '✗✗✗ Cláusula de isenção NÃO foi adicionada. Execute manualmente pelo dashboard.'
  END as status_final,
  SUBSTRING(
    content,
    GREATEST(1, POSITION('#### 2.4.1' IN content) - 200),
    LEAST(2000, LENGTH(content) - GREATEST(1, POSITION('#### 2.4.1' IN content) - 200) + 1)
  ) as conteudo_atualizado_secao_2_4_1
FROM site_terms
WHERE key = 'termos-assinatura-planos';

