-- ==========================================
-- ADICIONAR QUANTIDADES DOS SERVIÇOS NOS TERMOS
-- ==========================================
-- Insere a seção "Quantidades e Escopo Mensal" nos Termos de Serviços
-- Personalizados, definindo limites para Criação de conteúdo completa e
-- Gestão de redes sociais (mesma quantidade para assinatura mensal e anual).
-- Funciona com qualquer versão do termo (dashboard ou create_termos_servicos).
-- ==========================================
-- INSTRUÇÕES: Execute este script no SQL Editor do Supabase Dashboard
-- ==========================================

UPDATE public.site_terms
SET content = REPLACE(
  content,
  E'\n\n**Última atualização**',
  E'\n\n## Quantidades e Escopo Mensal (Serviços com limite)\n\nPara garantir qualidade e previsibilidade, os seguintes serviços possuem quantidade mensal definida, válida tanto para cobrança mensal quanto anual:\n\n- **Criação de conteúdo completa:** até 10 (dez) conteúdos por mês (posts, reels, artes ou mix conforme combinado).\n- **Gestão de redes sociais:** até 12 (doze) publicações por mês no total nas redes gerenciadas.\n\nAlterações de escopo ou quantidades acima podem ser tratadas sob demanda, mediante alinhamento prévio e eventual ajuste de valor.\n\n**Última atualização**'
)
WHERE key = 'termos-servicos'
  AND content LIKE '%**Última atualização**%'
  AND content NOT LIKE '%Quantidades e Escopo Mensal (Serviços com limite)%';

-- Verificar se a atualização foi aplicada
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count > 0 THEN
    RAISE NOTICE '✓ Seção "Quantidades e Escopo Mensal" adicionada aos Termos de Serviços Personalizados.';
  ELSE
    RAISE NOTICE 'ℹ Nenhuma linha atualizada. O termo já pode conter a seção ou o marcador "**Última atualização**" não foi encontrado.';
  END IF;
END $$;
