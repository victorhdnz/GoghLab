-- ==========================================
-- Atualizar Termos: Analytics (isenção) + Assinatura (clareza mensal/anual)
-- ==========================================
-- Execute no SQL Editor do Supabase (Dashboard > SQL Editor).
-- Se os termos foram editados manualmente, os REPLACE podem não encontrar o trecho;
-- nesse caso, adicione os blocos manualmente conforme indicado no final do arquivo.
-- ==========================================

-- 1) TERMOS DE USO: adicionar menção ao módulo Analytics e isenção
UPDATE site_terms
SET
  content = REPLACE(
    content,
    '- **Criação com IA**: funcionalidades de geração de conteúdo (texto, imagens, vídeos, roteiros, etc.) sujeitas aos limites do plano e à política de uso.

O uso efetivo de recursos que exijam assinatura está condicionado à contratação de um plano e ao cumprimento dos Termos de Assinatura e Planos.',
    '- **Criação com IA**: funcionalidades de geração de conteúdo (texto, imagens, vídeos, roteiros, etc.) sujeitas aos limites do plano e à política de uso.
- **Módulo de Análise e Estratégia (Analytics)**: ferramenta de planejamento e acompanhamento de campanhas de anúncios (ex.: Meta Ads). Os dados de campanhas, criativos, investimento e métricas são informados pelo próprio usuário na plataforma; as recomendações, status e sugestões (incluindo CPA, pausar criativos, escalar, etc.) são meramente indicativas e não constituem assessoria profissional, consultoria de mídia paga nem garantia de resultado. O usuário é exclusivamente responsável pelas decisões tomadas em suas campanhas e pelo uso dos dados que inserir. O Gogh Lab não se responsabiliza por resultados, prejuízos ou decisões baseadas no uso do módulo.

O uso efetivo de recursos que exijam assinatura está condicionado à contratação de um plano e ao cumprimento dos Termos de Assinatura e Planos.'
  ),
  updated_at = NOW()
WHERE key = 'termos-uso'
  AND content LIKE '%Criação com IA%'
  AND content NOT LIKE '%Módulo de Análise e Estratégia (Analytics)%';

-- 2) TERMOS DE ASSINATURA E PLANOS: clareza sobre assinatura (mensal/anual, cobrança recorrente)
UPDATE site_terms
SET
  content = REPLACE(
    content,
    'Ao assinar qualquer plano de assinatura da plataforma Gogh Lab, você concorda expressamente com os termos e condições estabelecidos neste documento. A contratação de qualquer plano implica na aceitação integral e irrestrita de todas as cláusulas aqui dispostas, bem como dos limites de uso e condições específicas de cada plano.

## 2. Planos de Assinatura',
    'Ao assinar qualquer plano de assinatura da plataforma Gogh Lab, você concorda expressamente com os termos e condições estabelecidos neste documento. A contratação de qualquer plano implica na aceitação integral e irrestrita de todas as cláusulas aqui dispostas, bem como dos limites de uso e condições específicas de cada plano.

**Natureza da contratação:** Ao contratar um plano pago, você está ciente de que se trata de uma **assinatura** com **cobrança recorrente**. No momento da contratação, você poderá escolher entre **cobrança mensal** ou **cobrança anual**, conforme as opções exibidas na página de planos (/precos). A cobrança será efetuada automaticamente no início de cada período (mensal ou anual, conforme a opção escolhida), no método de pagamento cadastrado, até que você cancele. Não se aplica compra avulsa ou pagamento único por período indefinido; o serviço é prestado sob regime de assinatura.

## 2. Planos de Assinatura'
  ),
  updated_at = NOW()
WHERE key = 'termos-assinatura-planos'
  AND content LIKE '%Ao assinar qualquer plano de assinatura da plataforma Gogh Lab%'
  AND content NOT LIKE '%Natureza da contratação%';

-- Verificar quantas linhas foram atualizadas (deve aparecer 1 ou 2 conforme o caso)
-- SELECT key, title, LEFT(content, 200) FROM site_terms WHERE key IN ('termos-uso', 'termos-assinatura-planos');
