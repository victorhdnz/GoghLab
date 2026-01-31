-- ==========================================
-- MIGRATION: Produtos globais, Planos x Produtos, Ferramentas dinâmicas, Prompts
-- Data: 2026-01-31
-- ==========================================
-- Permite: criar produtos globalmente; atribuir produtos a cada plano (Essencial/Pro);
-- criar ferramentas (vincular a produto, link vídeo, prazo 8 dias ou imediato);
-- sistema de prompts com categorias para área membros.
-- ==========================================

-- ==========================================
-- 1. PRODUCTS (Produtos globais)
-- ==========================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  product_type TEXT NOT NULL DEFAULT 'tool' CHECK (product_type IN ('tool', 'course', 'prompt', 'other')),
  order_position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_order ON products(order_position);

COMMENT ON TABLE products IS 'Produtos/recursos globais que podem ser atribuídos a planos (ferramentas, cursos, prompts, etc.)';

-- ==========================================
-- 2. PLAN_PRODUCTS (Quais produtos cada plano inclui)
-- ==========================================
CREATE TABLE IF NOT EXISTS plan_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('gogh_essencial', 'gogh_pro')),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_plan_products_plan_id ON plan_products(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_products_product_id ON plan_products(product_id);

COMMENT ON TABLE plan_products IS 'Produtos incluídos em cada plano de assinatura (Essencial e Pro)';

-- ==========================================
-- 3. TOOLS (Ferramentas - vinculadas a produto, vídeo, prazo 8 dias)
-- ==========================================
CREATE TABLE IF NOT EXISTS tools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  tutorial_video_url TEXT,
  requires_8_days BOOLEAN DEFAULT true,
  order_position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tools_product_id ON tools(product_id);
CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug);
CREATE INDEX IF NOT EXISTS idx_tools_order ON tools(order_position);

COMMENT ON TABLE tools IS 'Ferramentas que membros podem solicitar; vinculadas a um produto (opcional); tutorial_video_url e requires_8_days por ferramenta';

-- ==========================================
-- 4. Adicionar tool_id em tool_access_credentials (mantém tool_type para legado)
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tool_access_credentials' AND column_name = 'tool_id') THEN
    ALTER TABLE tool_access_credentials ADD COLUMN tool_id UUID REFERENCES tools(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Permitir tool_type como qualquer string (não só canva/capcut) para novas ferramentas
ALTER TABLE tool_access_credentials DROP CONSTRAINT IF EXISTS tool_access_credentials_tool_type_check;

-- Adicionar tutorial_video_url em tools se não existir (já está na CREATE TABLE)
-- tool_access_credentials já pode ter tutorial_video_url por registro

-- ==========================================
-- 5. PROMPT_CATEGORIES (Categorias de prompts)
-- ==========================================
CREATE TABLE IF NOT EXISTS prompt_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  order_position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_categories_slug ON prompt_categories(slug);
CREATE INDEX IF NOT EXISTS idx_prompt_categories_order ON prompt_categories(order_position);

-- ==========================================
-- 6. PROMPTS (Textos de prompts por categoria)
-- ==========================================
CREATE TABLE IF NOT EXISTS prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES prompt_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_prompts_order ON prompts(order_position);

COMMENT ON TABLE prompt_categories IS 'Categorias para filtrar prompts na área membros';
COMMENT ON TABLE prompts IS 'Prompts disponíveis por plano (Essencial/Pro), exibidos na aba Prompts da área membros';

-- ==========================================
-- 7. support_tickets: adicionar tool_id (opcional) para vincular ticket à ferramenta
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_tickets' AND column_name = 'tool_id') THEN
    ALTER TABLE support_tickets ADD COLUMN tool_id UUID REFERENCES tools(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ==========================================
-- RLS
-- ==========================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Products: leitura pública (para exibir na home), escrita só admin
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
);

-- Plan products: leitura pública (para saber o que cada plano tem), escrita admin
DROP POLICY IF EXISTS "Plan products are viewable by everyone" ON plan_products;
CREATE POLICY "Plan products are viewable by everyone" ON plan_products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage plan_products" ON plan_products;
CREATE POLICY "Admins can manage plan_products" ON plan_products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
);

-- Tools: leitura pública para listar, escrita admin
DROP POLICY IF EXISTS "Tools are viewable by everyone" ON tools;
CREATE POLICY "Tools are viewable by everyone" ON tools FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage tools" ON tools;
CREATE POLICY "Admins can manage tools" ON tools FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
);

-- Prompt categories: leitura para usuários autenticados (membros veem), escrita admin
DROP POLICY IF EXISTS "Prompt categories viewable when active" ON prompt_categories;
CREATE POLICY "Prompt categories viewable when active" ON prompt_categories FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage prompt_categories" ON prompt_categories;
CREATE POLICY "Admins can manage prompt_categories" ON prompt_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
);

-- Prompts: leitura para usuários autenticados, escrita admin
DROP POLICY IF EXISTS "Prompts viewable when active" ON prompts;
CREATE POLICY "Prompts viewable when active" ON prompts FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage prompts" ON prompts;
CREATE POLICY "Admins can manage prompts" ON prompts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
);

-- ==========================================
-- Triggers updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_tools_updated_at ON tools;
CREATE TRIGGER update_tools_updated_at BEFORE UPDATE ON tools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_prompt_categories_updated_at ON prompt_categories;
CREATE TRIGGER update_prompt_categories_updated_at BEFORE UPDATE ON prompt_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_prompts_updated_at ON prompts;
CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON prompts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Dados iniciais: produtos e ferramentas (Canva, CapCut, Cursos, Prompts)
-- ==========================================
INSERT INTO products (id, name, slug, description, product_type, order_position, is_active) VALUES
  (gen_random_uuid(), 'Cursos de edição', 'cursos-edicao', 'Acesso aos cursos de edição de vídeo e foto', 'course', 0, true),
  (gen_random_uuid(), 'Prompts', 'prompts', 'Acesso à biblioteca de prompts para uso em IAs', 'prompt', 1, true)
ON CONFLICT (slug) DO NOTHING;

-- Inserir produtos de ferramentas (um produto por ferramenta para vincular)
INSERT INTO products (name, slug, description, product_type, order_position, is_active)
SELECT 'Canva Pro', 'canva-pro', 'Acesso à ferramenta Canva Pro', 'tool', 10, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'canva-pro');
INSERT INTO products (name, slug, description, product_type, order_position, is_active)
SELECT 'CapCut Pro', 'capcut-pro', 'Acesso à ferramenta CapCut Pro', 'tool', 11, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'capcut-pro');

-- Inserir tools vinculadas aos produtos (compatibilidade com canva/capcut)
INSERT INTO tools (product_id, name, slug, description, requires_8_days, order_position, is_active)
SELECT p.id, 'Canva Pro', 'canva', 'Acesso à conta Canva Pro compartilhada', true, 0, true
FROM products p WHERE p.slug = 'canva-pro'
ON CONFLICT (slug) DO NOTHING;
INSERT INTO tools (product_id, name, slug, description, requires_8_days, order_position, is_active)
SELECT p.id, 'CapCut Pro', 'capcut', 'Acesso à conta CapCut Pro compartilhada', true, 1, true
FROM products p WHERE p.slug = 'capcut-pro'
ON CONFLICT (slug) DO NOTHING;

-- Vincular Essencial e Pro aos produtos (cursos, prompts, canva, capcut) - Pro tem todos; Essencial tem menos ferramentas (ex: só canva ou conforme config)
-- Você pode ajustar depois no Dashboard: Essencial pode ter cursos + prompts + 1 ferramenta; Pro todos
INSERT INTO plan_products (plan_id, product_id)
SELECT 'gogh_essencial', id FROM products WHERE slug IN ('cursos-edicao', 'prompts', 'canva-pro')
ON CONFLICT (plan_id, product_id) DO NOTHING;
INSERT INTO plan_products (plan_id, product_id)
SELECT 'gogh_pro', id FROM products WHERE slug IN ('cursos-edicao', 'prompts', 'canva-pro', 'capcut-pro')
ON CONFLICT (plan_id, product_id) DO NOTHING;
