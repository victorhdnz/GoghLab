-- ==========================================
-- Adicionar ícone (imagem) por produto
-- Permite upload de ícone na aba de planos para exibir nos recursos de cada plano
-- ==========================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'icon_url') THEN
    ALTER TABLE products ADD COLUMN icon_url TEXT;
  END IF;
END $$;

COMMENT ON COLUMN products.icon_url IS 'URL da imagem/ícone do produto (upload na aba Planos do dashboard)';
