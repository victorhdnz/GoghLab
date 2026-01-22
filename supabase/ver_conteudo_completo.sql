-- ==========================================
-- VER CONTEÚDO COMPLETO DA SEÇÃO 2.4
-- ==========================================
-- Execute este script para ver o conteúdo completo
-- e depois me envie o resultado
-- ==========================================

-- Ver onde começa a seção 2.4
SELECT 
  '=== POSIÇÃO DA SEÇÃO 2.4 ===' as info,
  POSITION('### 2.4' IN content) as posicao_2_4,
  POSITION('#### 2.4' IN content) as posicao_2_4_4_niveis,
  POSITION('## 2.4' IN content) as posicao_2_4_2_niveis
FROM site_terms
WHERE key = 'termos-assinatura-planos';

-- Ver conteúdo completo da seção 2.4 até a seção 3
SELECT 
  '=== CONTEÚDO DA SEÇÃO 2.4 ===' as info,
  SUBSTRING(
    content,
    GREATEST(1, COALESCE(
      NULLIF(POSITION('### 2.4' IN content), 0),
      NULLIF(POSITION('#### 2.4' IN content), 0),
      NULLIF(POSITION('## 2.4' IN content), 0),
      POSITION('Acesso às Ferramentas' IN content)
    )),
    LEAST(
      5000,
      COALESCE(
        NULLIF(POSITION('## 3. Contratação' IN content), 0),
        NULLIF(POSITION('### 3.' IN content), 0),
        NULLIF(POSITION('## 3' IN content), 0),
        LENGTH(content)
      ) - GREATEST(1, COALESCE(
        NULLIF(POSITION('### 2.4' IN content), 0),
        NULLIF(POSITION('#### 2.4' IN content), 0),
        NULLIF(POSITION('## 2.4' IN content), 0),
        POSITION('Acesso às Ferramentas' IN content)
      ))
    )
  ) as conteudo_secao_2_4_completo
FROM site_terms
WHERE key = 'termos-assinatura-planos';

-- Ver se tem o texto IMPORTANTE e onde está
SELECT 
  '=== LOCALIZAÇÃO DO TEXTO IMPORTANTE ===' as info,
  POSITION('**IMPORTANTE:**' IN content) as posicao_importante,
  POSITION('IMPORTANTE' IN content) as posicao_importante_sem_asteriscos,
  POSITION('oitavo dia' IN content) as posicao_oitavo_dia,
  SUBSTRING(
    content,
    GREATEST(1, COALESCE(
      NULLIF(POSITION('**IMPORTANTE:**' IN content), 0),
      NULLIF(POSITION('IMPORTANTE' IN content), 0),
      NULLIF(POSITION('oitavo dia' IN content), 0)
    ) - 100),
    LEAST(800, LENGTH(content) - GREATEST(1, COALESCE(
      NULLIF(POSITION('**IMPORTANTE:**' IN content), 0),
      NULLIF(POSITION('IMPORTANTE' IN content), 0),
      NULLIF(POSITION('oitavo dia' IN content), 0)
    ) - 100) + 1)
  ) as contexto_importante
FROM site_terms
WHERE key = 'termos-assinatura-planos';

