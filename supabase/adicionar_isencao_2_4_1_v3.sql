-- ==========================================
-- ADICIONAR CLÁUSULA DE ISENÇÃO - VERSÃO 3 (ADAPTATIVA)
-- ==========================================
-- Este script verifica a estrutura real e adiciona a cláusula
-- ==========================================

-- PASSO 1: Ver a estrutura completa da seção 2.4
SELECT 
  '=== ESTRUTURA DA SEÇÃO 2.4 ===' as info,
  SUBSTRING(
    content,
    GREATEST(1, POSITION('### 2.4' IN content) - 100),
    LEAST(3000, LENGTH(content) - GREATEST(1, POSITION('### 2.4' IN content) - 100) + 1)
  ) as conteudo_secao_2_4
FROM site_terms
WHERE key = 'termos-assinatura-planos'
  AND (content LIKE '%### 2.4%' OR content LIKE '%#### 2.4%');

-- PASSO 2: Verificar padrões possíveis
SELECT 
  '=== VERIFICAÇÃO DE PADRÕES ===' as info,
  CASE 
    WHEN content LIKE '%#### 2.4.1%' THEN 'Usa #### (4 níveis)'
    WHEN content LIKE '%### 2.4.1%' THEN 'Usa ### (3 níveis)'
    WHEN content LIKE '%## 2.4.1%' THEN 'Usa ## (2 níveis)'
    WHEN content LIKE '%### 2.4%' THEN 'Tem seção 2.4 mas estrutura diferente'
    ELSE 'Seção 2.4 não encontrada'
  END as estrutura_encontrada,
  CASE 
    WHEN content LIKE '%IMPORTANTE:%' THEN 'Tem texto IMPORTANTE'
    ELSE 'Sem texto IMPORTANTE'
  END as tem_importante,
  CASE 
    WHEN content LIKE '%oitavo dia%' THEN 'Menciona oitavo dia'
    ELSE 'Não menciona oitavo dia'
  END as tem_oitavo_dia
FROM site_terms
WHERE key = 'termos-assinatura-planos';

-- PASSO 3: Adicionar cláusula de forma adaptativa
DO $$
DECLARE
  v_content TEXT;
  v_clausula_isencao TEXT := E'\n\n**ISENÇÃO DE RESPONSABILIDADE:** Ao contratar qualquer plano de assinatura, você reconhece e aceita expressamente que o acesso às ferramentas profissionais (Canva Pro e CapCut Pro) estará disponível apenas a partir do oitavo dia após o início da sua assinatura (ou renovação), e que este período de espera é uma condição essencial do contrato, estabelecida para garantir o cumprimento do período de arrependimento previsto no CDC. Você concorda que não terá direito a qualquer tipo de compensação, reembolso parcial, desconto ou indenização em decorrência deste período de espera, e que esta condição não constitui falha na prestação do serviço ou descumprimento contratual por parte da Gogh Lab.';
  v_posicao_importante INT;
  v_posicao_proximo_titulo INT;
  v_texto_antes TEXT;
  v_texto_depois TEXT;
BEGIN
  -- Buscar conteúdo atual
  SELECT content INTO v_content
  FROM site_terms
  WHERE key = 'termos-assinatura-planos';
  
  -- Verificar se já tem a cláusula
  IF v_content LIKE '%ISENÇÃO DE RESPONSABILIDADE:%' THEN
    RAISE NOTICE '✓ Cláusula de isenção já existe.';
    RETURN;
  END IF;
  
  -- Procurar pelo texto "IMPORTANTE" ou "oitavo dia"
  v_posicao_importante := POSITION('**IMPORTANTE:**' IN v_content);
  
  IF v_posicao_importante = 0 THEN
    v_posicao_importante := POSITION('oitavo dia' IN v_content);
  END IF;
  
  IF v_posicao_importante > 0 THEN
    -- Encontrar o próximo título (### ou ####) após o IMPORTANTE
    -- Procurar por padrões como "### 2.4.2" ou "#### 2.4.2" ou "### 2.5" ou "## 3"
    v_posicao_proximo_titulo := (
      SELECT MIN(pos)
      FROM (
        SELECT POSITION('### 2.4.2' IN v_content) as pos
        UNION ALL
        SELECT POSITION('#### 2.4.2' IN v_content)
        UNION ALL
        SELECT POSITION('### 2.5' IN v_content)
        UNION ALL
        SELECT POSITION('## 3. Contratação' IN v_content)
        UNION ALL
        SELECT POSITION('## 3.' IN v_content)
      ) sub
      WHERE pos > v_posicao_importante AND pos > 0
    );
    
    IF v_posicao_proximo_titulo > 0 THEN
      -- Encontrar o final do parágrafo do IMPORTANTE (antes do próximo título)
      -- Procurar pela última linha antes do próximo título
      v_texto_antes := SUBSTRING(v_content, 1, v_posicao_proximo_titulo - 1);
      v_texto_depois := SUBSTRING(v_content, v_posicao_proximo_titulo);
      
      -- Adicionar a cláusula antes do próximo título
      v_content := v_texto_antes || v_clausula_isencao || E'\n\n' || v_texto_depois;
      
      -- Atualizar no banco
      UPDATE site_terms
      SET content = v_content, updated_at = NOW()
      WHERE key = 'termos-assinatura-planos';
      
      RAISE NOTICE '✓ Cláusula de isenção adicionada com sucesso!';
    ELSE
      -- Se não encontrou próximo título, adicionar no final do parágrafo IMPORTANTE
      -- Procurar por quebras de linha após o IMPORTANTE
      v_texto_antes := SUBSTRING(v_content, 1, v_posicao_importante);
      v_texto_depois := SUBSTRING(v_content, v_posicao_importante);
      
      -- Encontrar o final do parágrafo (duas quebras de linha seguidas ou próximo título)
      v_posicao_proximo_titulo := POSITION(E'\n\n##' IN v_texto_depois);
      IF v_posicao_proximo_titulo = 0 THEN
        v_posicao_proximo_titulo := POSITION(E'\n\n###' IN v_texto_depois);
      END IF;
      
      IF v_posicao_proximo_titulo > 0 THEN
        v_texto_antes := SUBSTRING(v_content, 1, v_posicao_importante + v_posicao_proximo_titulo - 1);
        v_texto_depois := SUBSTRING(v_content, v_posicao_importante + v_posicao_proximo_titulo);
        v_content := v_texto_antes || v_clausula_isencao || v_texto_depois;
        
        UPDATE site_terms
        SET content = v_content, updated_at = NOW()
        WHERE key = 'termos-assinatura-planos';
        
        RAISE NOTICE '✓ Cláusula de isenção adicionada com sucesso!';
      ELSE
        RAISE NOTICE '⚠ Não foi possível encontrar onde inserir a cláusula automaticamente.';
      END IF;
    END IF;
  ELSE
    RAISE NOTICE '⚠ Texto "IMPORTANTE" ou "oitavo dia" não encontrado no conteúdo.';
  END IF;
END $$;

-- PASSO 4: Verificar resultado
SELECT 
  '=== RESULTADO FINAL ===' as info,
  CASE 
    WHEN content LIKE '%ISENÇÃO DE RESPONSABILIDADE:%' THEN '✓✓✓ Cláusula de isenção ADICIONADA!'
    ELSE '✗ Cláusula de isenção NÃO foi adicionada'
  END as status,
  -- Mostrar contexto ao redor da cláusula (se foi adicionada)
  CASE 
    WHEN content LIKE '%ISENÇÃO DE RESPONSABILIDADE:%' THEN
      SUBSTRING(
        content,
        GREATEST(1, POSITION('ISENÇÃO DE RESPONSABILIDADE' IN content) - 500),
        LEAST(1500, LENGTH(content) - GREATEST(1, POSITION('ISENÇÃO DE RESPONSABILIDADE' IN content) - 500) + 1)
      )
    ELSE
      'Execute manualmente pelo dashboard ou verifique o conteúdo'
  END as contexto_clausula
FROM site_terms
WHERE key = 'termos-assinatura-planos';

