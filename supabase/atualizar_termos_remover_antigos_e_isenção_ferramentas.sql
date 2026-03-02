-- ==========================================
-- ATUALIZAR TERMOS: REMOVER ITENS ANTIGOS E ADICIONAR ISENÇÃO SOBRE FERRAMENTAS
-- ==========================================
-- 1. Remove "Termos de Serviços Personalizados" (não é mais oferecido no site)
-- 2. Remove "Prompts e Recursos Digitais" da seção 2.3 Limites de Uso (recurso antigo)
-- 3. Adiciona isenção de responsabilidade sobre as formas de acesso às ferramentas
--    (link para equipe, conta compartilhada, credenciais, etc.)
-- ==========================================
-- INSTRUÇÕES: Execute no SQL Editor do Supabase Dashboard
-- ==========================================

-- ---------------------------------------------------------------------------
-- 1. REMOVER O TERMO "Termos de Serviços Personalizados" da base
-- ---------------------------------------------------------------------------
DELETE FROM site_terms
WHERE key = 'termos-servicos';

-- ---------------------------------------------------------------------------
-- 2. ATUALIZAR "Termos de Assinatura e Planos": remover linha de Prompts
-- ---------------------------------------------------------------------------
UPDATE site_terms
SET content = REPLACE(
  REPLACE(
    content,
    '- **Prompts e Recursos Digitais**: Conforme descrito em cada plano' || E'\r\n',
    ''
  ),
  '- **Prompts e Recursos Digitais**: Conforme descrito em cada plano' || E'\n',
  ''
)
WHERE key = 'termos-assinatura-planos'
  AND content LIKE '%Prompts e Recursos Digitais%';

-- ---------------------------------------------------------------------------
-- 3. ADICIONAR ISENÇÃO: formas de acesso às ferramentas (link, conta, etc.)
--    Inserida após o primeiro parágrafo de 2.4.1 Fornecimento de Acessos.
-- ---------------------------------------------------------------------------
UPDATE site_terms
SET content = REPLACE(
  content,
  'garantindo que o serviço seja prestado em conformidade com as políticas da plataforma e dos provedores das ferramentas.',
  'garantindo que o serviço seja prestado em conformidade com as políticas da plataforma e dos provedores das ferramentas.

**Formas de acesso às ferramentas:** O acesso aos recursos incluídos no plano pode ser disponibilizado de diferentes formas, a critério da plataforma e conforme a natureza de cada ferramenta, tais como: link para entrada em equipe ou espaço de trabalho, utilização de conta já existente e compartilhada, fornecimento de credenciais (login e senha), ou outro meio adequado. Ao assinar o plano, você declara estar ciente de que a forma de acesso pode variar e aceita expressamente que não haverá direito a reclamação, reembolso ou compensação em razão do tipo de acesso oferecido (link, conta compartilhada, credenciais, etc.), desde que o recurso seja disponibilizado nos termos descritos na plataforma.'
)
WHERE key = 'termos-assinatura-planos'
  AND content LIKE '%garantindo que o serviço seja prestado em conformidade com as políticas da plataforma e dos provedores das ferramentas.%'
  AND content NOT LIKE '%Formas de acesso às ferramentas%';

-- ---------------------------------------------------------------------------
-- Verificação: listar termos restantes
-- ---------------------------------------------------------------------------
SELECT key, title, LEFT(content, 80) || '...' AS content_preview, updated_at
FROM site_terms
ORDER BY key;
