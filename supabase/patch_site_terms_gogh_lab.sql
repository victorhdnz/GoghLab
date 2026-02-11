-- ==========================================
-- Atualizar textos: "A Gogh Lab" → "O Gogh Lab" e contrações
-- Execute no Supabase SQL Editor (tabela site_terms já deve existir).
-- ==========================================

UPDATE public.site_terms
SET content = replace(
  replace(
    replace(
      replace(
        replace(content, 'A Gogh Lab', 'O Gogh Lab'),
        'da Gogh Lab', 'do Gogh Lab'
      ),
      'pela Gogh Lab', 'pelo Gogh Lab'
    ),
    ' a Gogh Lab', ' o Gogh Lab'
  ),
  ' na Gogh Lab', ' no Gogh Lab'
)
WHERE content LIKE '%Gogh Lab%';
