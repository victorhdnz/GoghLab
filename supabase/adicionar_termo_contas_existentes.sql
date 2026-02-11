-- ==========================================
-- ADICIONAR CLÁUSULA: CONTAS JÁ CRIADAS E EXISTENTES
-- ==========================================
-- Este script adiciona a subseção 2.4.7 aos Termos de Assinatura e Planos,
-- informando que o acesso às ferramentas refere-se a contas já criadas e
-- existentes (para evitar reclamações futuras sobre criação de novas contas).
-- ==========================================
-- INSTRUÇÕES: Execute no SQL Editor do Supabase Dashboard
-- ==========================================

DO $$
DECLARE
  v_content TEXT;
  v_nova_secao TEXT := E'\n\n#### 2.4.7. Contas já criadas e existentes\n\nOs acessos às ferramentas incluídas no plano referem-se a **contas já criadas e existentes**, disponibilizadas pelo Gogh Lab para uso conforme o plano contratado. O assinante reconhece que o acesso concedido não implica a criação de novas contas pessoais em seu nome pelos provedores das ferramentas; a plataforma disponibiliza o uso de contas existentes nos termos aqui descritos. Não há direito a contas exclusivas ou de titularidade do assinante, salvo quando expressamente previsto na descrição do plano ou da ferramenta.\n\n**Não será possível alterar a senha** das contas disponibilizadas; o uso deve ser realizado com as credenciais fornecidas.\n\nAs contas podem ser **compartilhadas**, podendo haver mais de uma pessoa utilizando a mesma conta, conforme a operação da plataforma e das ferramentas. O assinante está ciente dessa possibilidade ao solicitar o acesso.';

BEGIN
  -- Buscar conteúdo atual
  SELECT content INTO v_content
  FROM site_terms
  WHERE key = 'termos-assinatura-planos';

  IF v_content IS NULL THEN
    RAISE EXCEPTION 'Termo "termos-assinatura-planos" não encontrado. Execute primeiro o script que cria os termos de assinatura.';
  END IF;

  -- Verificar se a subseção 2.4.7 já existe
  IF v_content LIKE '%#### 2.4.7. Contas já criadas e existentes%' THEN
    -- Se já existe mas não tem as frases sobre senha e compartilhamento, adicionar
    IF v_content NOT LIKE '%Não será possível alterar a senha%' THEN
      v_content := REGEXP_REPLACE(
        v_content,
        '(Não há direito a contas exclusivas ou de titularidade do assinante, salvo quando expressamente previsto na descrição do plano ou da ferramenta\.)(\s*)',
        E'\\1\n\n**Não será possível alterar a senha** das contas disponibilizadas; o uso deve ser realizado com as credenciais fornecidas.\n\nAs contas podem ser **compartilhadas**, podendo haver mais de uma pessoa utilizando a mesma conta, conforme a operação da plataforma e das ferramentas. O assinante está ciente dessa possibilidade ao solicitar o acesso.\\2',
        'g'
      );
      UPDATE site_terms SET content = v_content, updated_at = NOW() WHERE key = 'termos-assinatura-planos';
      RAISE NOTICE '✓ Subseção 2.4.7 já existia; frases sobre senha e compartilhamento adicionadas.';
    ELSE
      RAISE NOTICE '✓ A subseção 2.4.7 (Contas já criadas e existentes) já existe com o conteúdo completo. Nenhuma alteração feita.';
    END IF;
    RETURN;
  END IF;

  -- Inserir a nova subseção após o fim da 2.4.6 (sem direito a reembolso) e antes de "## 3."
  v_content := REGEXP_REPLACE(
    v_content,
    '(sem direito a reembolso\.)(\s*\n+)(## 3\.\s*Contratação)',
    E'\\1' || v_nova_secao || E'\\2\\3',
    'g'
  );

  -- Se ainda não inseriu (ex.: texto com variação), inserir antes de qualquer "## 3."
  IF v_content NOT LIKE '%#### 2.4.7. Contas já criadas e existentes%' THEN
    v_content := REGEXP_REPLACE(
      v_content,
      '(\n\n)(## 3\.)',
      v_nova_secao || E'\\1\\2',
      'g'
    );
  END IF;

  UPDATE site_terms
  SET content = v_content, updated_at = NOW()
  WHERE key = 'termos-assinatura-planos';

  RAISE NOTICE '✓ Subseção 2.4.7 (Contas já criadas e existentes) adicionada aos Termos de Assinatura e Planos.';
END $$;

-- Opcional: exibir resultado da atualização para conferência
SELECT
  key AS termo,
  CASE
    WHEN content LIKE '%#### 2.4.7. Contas já criadas e existentes%' THEN 'Subseção 2.4.7 presente'
    ELSE 'Subseção 2.4.7 não encontrada'
  END AS resultado,
  updated_at
FROM site_terms
WHERE key = 'termos-assinatura-planos';
