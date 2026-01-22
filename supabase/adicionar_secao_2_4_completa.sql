-- ==========================================
-- ADICIONAR SEÇÃO 2.4 COMPLETA COM CLÁUSULA DE ISENÇÃO
-- ==========================================
-- Este script adiciona a seção 2.4 completa (Acesso às Ferramentas Pro)
-- incluindo a subseção 2.4.1 com a cláusula de isenção
-- ==========================================

-- PASSO 1: Ver onde termina a seção 2.3 e começa a seção 3
SELECT 
  '=== LOCALIZAÇÃO DAS SEÇÕES ===' as info,
  POSITION('### 2.3. Limites de Uso' IN content) as posicao_2_3,
  POSITION('## 3. Contratação' IN content) as posicao_3,
  POSITION('### 2.4' IN content) as posicao_2_4_existente,
  SUBSTRING(
    content,
    GREATEST(1, POSITION('### 2.3. Limites de Uso' IN content)),
    LEAST(500, COALESCE(NULLIF(POSITION('## 3. Contratação' IN content), 0), LENGTH(content)) - POSITION('### 2.3. Limites de Uso' IN content))
  ) as conteudo_entre_2_3_e_3
FROM site_terms
WHERE key = 'termos-assinatura-planos';

-- PASSO 2: Adicionar a seção 2.4 completa
DO $$
DECLARE
  v_content TEXT;
  v_secao_2_4 TEXT := E'\n\n### 2.4. Acesso às Ferramentas Pro (Canva Pro e CapCut Pro)\n\n#### 2.4.1. Período de Liberação\n\nConforme o Código de Defesa do Consumidor (CDC), você tem 7 (sete) dias corridos a partir da data de contratação para exercer seu direito de arrependimento e solicitar reembolso total.\n\nPara garantir que o período de arrependimento seja respeitado e evitar que credenciais de acesso sejam fornecidas antes do término deste prazo, o **acesso às ferramentas profissionais Canva Pro e CapCut Pro será liberado apenas a partir do oitavo dia** após a data de início da sua assinatura.\n\n**IMPORTANTE:** Esta regra se aplica tanto para **compras iniciais** (primeira contratação de um plano) quanto para **renovações** (renovação automática ou manual da assinatura). Em ambos os casos, o período de espera de 8 dias é contado a partir da data de início do novo período de assinatura (current_period_start), garantindo que o direito de arrependimento seja respeitado em cada ciclo contratual.\n\n**ISENÇÃO DE RESPONSABILIDADE:** Ao contratar qualquer plano de assinatura, você reconhece e aceita expressamente que o acesso às ferramentas profissionais (Canva Pro e CapCut Pro) estará disponível apenas a partir do oitavo dia após o início da sua assinatura (ou renovação), e que este período de espera é uma condição essencial do contrato, estabelecida para garantir o cumprimento do período de arrependimento previsto no CDC. Você concorda que não terá direito a qualquer tipo de compensação, reembolso parcial, desconto ou indenização em decorrência deste período de espera, e que esta condição não constitui falha na prestação do serviço ou descumprimento contratual por parte da Gogh Lab.\n\n#### 2.4.2. Processo de Solicitação\n\n- Após o oitavo dia da assinatura (seja compra inicial ou renovação), você poderá solicitar acesso às ferramentas através da área de membros\n- A solicitação será processada e o acesso será liberado em até 24 horas após a aprovação\n- Você receberá as credenciais de acesso (link de ativação do Canva Pro e login/senha do CapCut Pro) através da plataforma\n\n#### 2.4.3. Período de Uso\n\nApós a liberação do acesso, você terá **30 (trinta) dias de uso** das ferramentas Canva Pro e CapCut Pro, contados a partir da data de liberação das credenciais. Este período é independente do ciclo de cobrança da sua assinatura e visa garantir que você tenha tempo suficiente para aproveitar os recursos das ferramentas.\n\n#### 2.4.4. Renovação do Acesso\n\nO acesso às ferramentas pode ser renovado mediante nova solicitação, desde que sua assinatura esteja ativa e em dia. **A renovação seguirá o mesmo processo descrito acima, incluindo o período de espera de 8 dias a partir da data de início do novo período de assinatura.** Ou seja, mesmo que você já tenha tido acesso às ferramentas em um período anterior, ao renovar sua assinatura, será necessário aguardar novamente o oitavo dia do novo período para solicitar um novo acesso.\n\n#### 2.4.5. Responsabilidade pelo Uso\n\nVocê é responsável pelo uso adequado das credenciais fornecidas e deve manter a confidencialidade das mesmas. O compartilhamento não autorizado das credenciais pode resultar no cancelamento imediato do acesso, sem direito a reembolso.';
  v_posicao_2_3_fim INT;
  v_posicao_3_inicio INT;
  v_texto_antes TEXT;
  v_texto_depois TEXT;
BEGIN
  -- Buscar conteúdo atual
  SELECT content INTO v_content
  FROM site_terms
  WHERE key = 'termos-assinatura-planos';
  
  -- Verificar se a seção 2.4 já existe
  IF v_content LIKE '%### 2.4. Acesso às Ferramentas Pro%' OR v_content LIKE '%#### 2.4.1%' THEN
    RAISE NOTICE '⚠ Seção 2.4 já existe. Verificando se precisa atualizar...';
    
    -- Se existe mas não tem a cláusula de isenção, adicionar
    IF v_content NOT LIKE '%ISENÇÃO DE RESPONSABILIDADE:%' THEN
      -- Adicionar cláusula após IMPORTANTE
      v_content := REGEXP_REPLACE(
        v_content,
        E'(garantindo que o direito de arrependimento seja respeitado em cada ciclo contratual\\.)(\\s*\\n\\s*)(#### 2\\.4\\.2|### 2\\.4\\.2|## 3)',
        E'\\1\\2\\n\\n**ISENÇÃO DE RESPONSABILIDADE:** Ao contratar qualquer plano de assinatura, você reconhece e aceita expressamente que o acesso às ferramentas profissionais (Canva Pro e CapCut Pro) estará disponível apenas a partir do oitavo dia após o início da sua assinatura (ou renovação), e que este período de espera é uma condição essencial do contrato, estabelecida para garantir o cumprimento do período de arrependimento previsto no CDC. Você concorda que não terá direito a qualquer tipo de compensação, reembolso parcial, desconto ou indenização em decorrência deste período de espera, e que esta condição não constitui falha na prestação do serviço ou descumprimento contratual por parte da Gogh Lab.\\2\\3',
        'g'
      );
      
      UPDATE site_terms
      SET content = v_content, updated_at = NOW()
      WHERE key = 'termos-assinatura-planos';
      
      RAISE NOTICE '✓ Cláusula de isenção adicionada à seção 2.4 existente!';
    ELSE
      RAISE NOTICE '✓ Seção 2.4 já existe com a cláusula de isenção.';
    END IF;
  ELSE
    -- Seção 2.4 não existe, adicionar completa
    -- Encontrar onde termina a seção 2.3 (Limites de Uso)
    v_posicao_2_3_fim := POSITION('### 2.3. Limites de Uso' IN v_content);
    
    IF v_posicao_2_3_fim > 0 THEN
      -- Encontrar o final da seção 2.3 (próxima seção ou fim do conteúdo)
      v_posicao_3_inicio := COALESCE(
        NULLIF(POSITION('## 3. Contratação' IN v_content), 0),
        NULLIF(POSITION('## 3.' IN v_content), 0),
        LENGTH(v_content) + 1
      );
      
      -- Dividir o conteúdo
      v_texto_antes := SUBSTRING(v_content, 1, v_posicao_3_inicio - 1);
      v_texto_depois := SUBSTRING(v_content, v_posicao_3_inicio);
      
      -- Garantir que há uma quebra de linha antes de adicionar
      IF v_texto_antes NOT LIKE '%\n\n' THEN
        v_texto_antes := v_texto_antes || E'\n';
      END IF;
      
      -- Adicionar a seção 2.4 completa
      v_content := v_texto_antes || v_secao_2_4 || E'\n\n' || v_texto_depois;
      
      -- Atualizar no banco
      UPDATE site_terms
      SET content = v_content, updated_at = NOW()
      WHERE key = 'termos-assinatura-planos';
      
      RAISE NOTICE '✓ Seção 2.4 completa adicionada com sucesso!';
    ELSE
      RAISE NOTICE '⚠ Não foi possível encontrar a seção 2.3. Adicionando antes da seção 3.';
      
      -- Tentar adicionar antes da seção 3
      v_posicao_3_inicio := COALESCE(
        NULLIF(POSITION('## 3. Contratação' IN v_content), 0),
        NULLIF(POSITION('## 3.' IN v_content), 0),
        LENGTH(v_content) + 1
      );
      
      IF v_posicao_3_inicio > 0 THEN
        v_texto_antes := SUBSTRING(v_content, 1, v_posicao_3_inicio - 1);
        v_texto_depois := SUBSTRING(v_content, v_posicao_3_inicio);
        
        IF v_texto_antes NOT LIKE '%\n\n' THEN
          v_texto_antes := v_texto_antes || E'\n';
        END IF;
        
        v_content := v_texto_antes || v_secao_2_4 || E'\n\n' || v_texto_depois;
        
        UPDATE site_terms
        SET content = v_content, updated_at = NOW()
        WHERE key = 'termos-assinatura-planos';
        
        RAISE NOTICE '✓ Seção 2.4 completa adicionada antes da seção 3!';
      ELSE
        RAISE NOTICE '✗ Não foi possível encontrar onde inserir a seção.';
      END IF;
    END IF;
  END IF;
END $$;

-- PASSO 3: Verificar resultado
SELECT 
  '=== RESULTADO FINAL ===' as info,
  CASE 
    WHEN content LIKE '%### 2.4. Acesso às Ferramentas Pro%' OR content LIKE '%#### 2.4.1%' THEN '✓ Seção 2.4 encontrada'
    ELSE '✗ Seção 2.4 NÃO encontrada'
  END as status_secao,
  CASE 
    WHEN content LIKE '%ISENÇÃO DE RESPONSABILIDADE:%' THEN '✓ Cláusula de isenção presente'
    ELSE '✗ Cláusula de isenção NÃO encontrada'
  END as status_isencao,
  SUBSTRING(
    content,
    GREATEST(1, COALESCE(
      NULLIF(POSITION('### 2.4' IN content), 0),
      NULLIF(POSITION('#### 2.4.1' IN content), 0)
    )),
    LEAST(2000, COALESCE(
      NULLIF(POSITION('## 3. Contratação' IN content), 0),
      LENGTH(content)
    ) - GREATEST(1, COALESCE(
      NULLIF(POSITION('### 2.4' IN content), 0),
      NULLIF(POSITION('#### 2.4.1' IN content), 0)
    )))
  ) as conteudo_secao_2_4
FROM site_terms
WHERE key = 'termos-assinatura-planos';

