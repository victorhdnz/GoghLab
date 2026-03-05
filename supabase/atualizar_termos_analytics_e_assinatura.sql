-- ==========================================
-- ATUALIZAR TERMOS DE USO: adicionar módulo Analytics (isenção)
-- ==========================================
-- Mesmo padrão dos scripts existentes (atualizar_termos_assinatura_simples, etc.)
-- INSTRUÇÕES: Execute no SQL Editor do Supabase Dashboard
-- ==========================================

-- 1. TERMOS DE USO: inserir parágrafo do Analytics antes de "O uso efetivo de recursos..."
--    Usa REPLACE com E'\n\n' para quebra de linha (como nos outros scripts).
UPDATE site_terms
SET
  content = REPLACE(
    content,
    E'O uso efetivo de recursos que exijam assinatura está condicionado à contratação de um plano e ao cumprimento dos Termos de Assinatura e Planos.',
    E'- **Módulo de Análise e Estratégia (Analytics)**: ferramenta de planejamento e acompanhamento de campanhas de anúncios (ex.: Meta Ads). Os dados de campanhas, criativos, investimento e métricas são informados pelo próprio usuário na plataforma; as recomendações, status e sugestões (incluindo CPA, pausar criativos, escalar, etc.) são meramente indicativas e não constituem assessoria profissional, consultoria de mídia paga nem garantia de resultado. O usuário é exclusivamente responsável pelas decisões tomadas em suas campanhas e pelo uso dos dados que inserir. O Gogh Lab não se responsabiliza por resultados, prejuízos ou decisões baseadas no uso do módulo.\n\nO uso efetivo de recursos que exijam assinatura está condicionado à contratação de um plano e ao cumprimento dos Termos de Assinatura e Planos.'
  ),
  updated_at = NOW()
WHERE key = 'termos-uso'
  AND content LIKE '%O uso efetivo de recursos que exijam assinatura está condicionado%'
  AND content NOT LIKE '%Módulo de Análise e Estratégia (Analytics)%';

-- 2. Verificar resultado (igual aos outros scripts)
SELECT
  key,
  title,
  CASE
    WHEN content LIKE '%Módulo de Análise e Estratégia (Analytics)%' THEN '✓ Parágrafo Analytics presente'
    ELSE '✗ Parágrafo Analytics NÃO encontrado'
  END AS status_analytics,
  updated_at
FROM site_terms
WHERE key = 'termos-uso';
