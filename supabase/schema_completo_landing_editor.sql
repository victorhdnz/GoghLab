-- ==========================================
-- SCHEMA COMPLETO - EDITOR DE LANDING PAGE / COMPARADOR DE PRODUTOS
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- PROFILES (Usuários)
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'editor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PRODUCTS (Produtos)
-- ==========================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  local_price DECIMAL(10, 2) NOT NULL,
  national_price DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  weight DECIMAL(10, 2),
  width DECIMAL(10, 2),
  height DECIMAL(10, 2),
  length DECIMAL(10, 2),
  category TEXT,
  tags TEXT[],
  images TEXT[] DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PRODUCT COLORS (Variações de Cor)
-- ==========================================
CREATE TABLE IF NOT EXISTS product_colors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  color_name TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- LANDING LAYOUTS (Layouts Principais)
-- ==========================================
CREATE TABLE IF NOT EXISTS landing_layouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  custom_url TEXT UNIQUE,
  theme_colors JSONB DEFAULT '{}',
  default_fonts JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- LANDING VERSIONS (Versões/Campanhas)
-- ==========================================
CREATE TABLE IF NOT EXISTS landing_versions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  layout_id UUID REFERENCES landing_layouts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  version_number INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  custom_styles JSONB DEFAULT '{}',
  sections_config JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(layout_id, slug)
);

-- ==========================================
-- LANDING ANALYTICS (Analytics/Tracking)
-- ==========================================
CREATE TABLE IF NOT EXISTS landing_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  layout_id UUID REFERENCES landing_layouts(id) ON DELETE CASCADE,
  version_id UUID REFERENCES landing_versions(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'click', 'scroll', 'time_on_page', 'exit', 'conversion')),
  event_data JSONB DEFAULT '{}',
  user_agent TEXT,
  referrer TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PRODUCT COMPARISONS (Comparador)
-- ==========================================
CREATE TABLE IF NOT EXISTS product_comparisons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  comparison_topics JSONB DEFAULT '[]',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- SAVED COMPARISONS (Links de Comparação Salvos)
-- ==========================================
CREATE TABLE IF NOT EXISTS saved_comparisons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  product_ids TEXT[] NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PRODUCT SUPPORT PAGES (Páginas de Suporte/Manual)
-- ==========================================
CREATE TABLE IF NOT EXISTS product_support_pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  model_slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PRODUCT CATALOGS (Catálogos de Produtos)
-- ==========================================
CREATE TABLE IF NOT EXISTS product_catalogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  theme_colors JSONB DEFAULT '{
    "primary": "#000000",
    "secondary": "#ffffff",
    "accent": "#D4AF37",
    "background": "#ffffff",
    "text": "#000000"
  }'::jsonb,
  content JSONB DEFAULT '{
    "hero": {},
    "categories": [],
    "featured_products": [],
    "sections": []
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- SITE SETTINGS (Configurações Globais)
-- ==========================================
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  site_name TEXT,
  site_title TEXT,
  site_logo TEXT,
  site_description TEXT,
  footer_text TEXT,
  copyright_text TEXT,
  contact_email TEXT,
  contact_whatsapp TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  loading_emoji TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- SITE TERMS (Termos e Políticas)
-- ==========================================
CREATE TABLE IF NOT EXISTS site_terms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  icon TEXT DEFAULT 'file-text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ÍNDICES PARA PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_landing_layouts_slug ON landing_layouts(slug);
CREATE INDEX IF NOT EXISTS idx_landing_layouts_custom_url ON landing_layouts(custom_url);
CREATE INDEX IF NOT EXISTS idx_landing_versions_layout_id ON landing_versions(layout_id);
CREATE INDEX IF NOT EXISTS idx_landing_versions_slug ON landing_versions(layout_id, slug);
CREATE INDEX IF NOT EXISTS idx_landing_analytics_layout_id ON landing_analytics(layout_id);
CREATE INDEX IF NOT EXISTS idx_landing_analytics_version_id ON landing_analytics(version_id);
CREATE INDEX IF NOT EXISTS idx_landing_analytics_created_at ON landing_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_landing_analytics_event_type ON landing_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_product_comparisons_product_id ON product_comparisons(product_id);
CREATE INDEX IF NOT EXISTS idx_product_support_pages_product_id ON product_support_pages(product_id);
CREATE INDEX IF NOT EXISTS idx_product_support_pages_model_slug ON product_support_pages(model_slug);
CREATE INDEX IF NOT EXISTS idx_saved_comparisons_slug ON saved_comparisons(slug);
CREATE INDEX IF NOT EXISTS idx_product_catalogs_slug ON product_catalogs(slug);
CREATE INDEX IF NOT EXISTS idx_product_catalogs_is_active ON product_catalogs(is_active);
CREATE INDEX IF NOT EXISTS idx_site_terms_key ON site_terms(key);

-- ==========================================
-- RLS (Row Level Security) Policies
-- ==========================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (is_active = true OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Only admins can insert products" ON products;
CREATE POLICY "Only admins can insert products" ON products FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
DROP POLICY IF EXISTS "Only admins can update products" ON products;
CREATE POLICY "Only admins can update products" ON products FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Only admins can delete products" ON products;
CREATE POLICY "Only admins can delete products" ON products FOR DELETE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Product Colors
ALTER TABLE product_colors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Product colors are viewable by everyone" ON product_colors;
CREATE POLICY "Product colors are viewable by everyone" ON product_colors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Only admins can manage product colors" ON product_colors;
CREATE POLICY "Only admins can manage product colors" ON product_colors FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'editor')));

-- Landing Layouts
ALTER TABLE landing_layouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Landing layouts are viewable by everyone" ON landing_layouts;
CREATE POLICY "Landing layouts are viewable by everyone" ON landing_layouts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Landing layouts are insertable by admins and editors" ON landing_layouts;
CREATE POLICY "Landing layouts are insertable by admins and editors" ON landing_layouts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Landing layouts are updatable by admins and editors" ON landing_layouts;
CREATE POLICY "Landing layouts are updatable by admins and editors" ON landing_layouts FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Landing layouts are deletable by admins and editors" ON landing_layouts;
CREATE POLICY "Landing layouts are deletable by admins and editors" ON landing_layouts FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));

-- Landing Versions
ALTER TABLE landing_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Landing versions are viewable by everyone" ON landing_versions;
CREATE POLICY "Landing versions are viewable by everyone" ON landing_versions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Landing versions are insertable by admins and editors" ON landing_versions;
CREATE POLICY "Landing versions are insertable by admins and editors" ON landing_versions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Landing versions are updatable by admins and editors" ON landing_versions;
CREATE POLICY "Landing versions are updatable by admins and editors" ON landing_versions FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Landing versions are deletable by admins and editors" ON landing_versions;
CREATE POLICY "Landing versions are deletable by admins and editors" ON landing_versions FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));

-- Landing Analytics
ALTER TABLE landing_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Landing analytics are insertable by everyone" ON landing_analytics;
CREATE POLICY "Landing analytics are insertable by everyone" ON landing_analytics FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Landing analytics are viewable by admins and editors" ON landing_analytics;
CREATE POLICY "Landing analytics are viewable by admins and editors" ON landing_analytics FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));

-- Product Comparisons
ALTER TABLE product_comparisons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Product comparisons are viewable by everyone" ON product_comparisons;
CREATE POLICY "Product comparisons are viewable by everyone" ON product_comparisons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Product comparisons are insertable by admins and editors" ON product_comparisons;
CREATE POLICY "Product comparisons are insertable by admins and editors" ON product_comparisons FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Product comparisons are updatable by admins and editors" ON product_comparisons;
CREATE POLICY "Product comparisons are updatable by admins and editors" ON product_comparisons FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Product comparisons are deletable by admins and editors" ON product_comparisons;
CREATE POLICY "Product comparisons are deletable by admins and editors" ON product_comparisons FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));

-- Saved Comparisons
ALTER TABLE saved_comparisons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Saved comparisons are viewable by everyone" ON saved_comparisons;
CREATE POLICY "Saved comparisons are viewable by everyone" ON saved_comparisons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Saved comparisons are insertable by admins and editors" ON saved_comparisons;
CREATE POLICY "Saved comparisons are insertable by admins and editors" ON saved_comparisons FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Saved comparisons are updatable by admins and editors" ON saved_comparisons;
CREATE POLICY "Saved comparisons are updatable by admins and editors" ON saved_comparisons FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Saved comparisons are deletable by admins and editors" ON saved_comparisons;
CREATE POLICY "Saved comparisons are deletable by admins and editors" ON saved_comparisons FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));

-- Product Support Pages
ALTER TABLE product_support_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Product support pages are viewable by everyone" ON product_support_pages;
CREATE POLICY "Product support pages are viewable by everyone" ON product_support_pages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Product support pages are insertable by admins and editors" ON product_support_pages;
CREATE POLICY "Product support pages are insertable by admins and editors" ON product_support_pages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Product support pages are updatable by admins and editors" ON product_support_pages;
CREATE POLICY "Product support pages are updatable by admins and editors" ON product_support_pages FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Product support pages are deletable by admins and editors" ON product_support_pages;
CREATE POLICY "Product support pages are deletable by admins and editors" ON product_support_pages FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));

-- Product Catalogs
ALTER TABLE product_catalogs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Catálogos ativos são públicos" ON product_catalogs;
CREATE POLICY "Catálogos ativos são públicos" ON product_catalogs FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins podem ver todos os catálogos" ON product_catalogs;
CREATE POLICY "Admins podem ver todos os catálogos" ON product_catalogs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Admins podem criar catálogos" ON product_catalogs;
CREATE POLICY "Admins podem criar catálogos" ON product_catalogs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Admins podem atualizar catálogos" ON product_catalogs;
CREATE POLICY "Admins podem atualizar catálogos" ON product_catalogs FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Admins podem deletar catálogos" ON product_catalogs;
CREATE POLICY "Admins podem deletar catálogos" ON product_catalogs FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Site Settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Site settings are viewable by everyone" ON site_settings;
CREATE POLICY "Site settings are viewable by everyone" ON site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Only admins can update site settings" ON site_settings;
CREATE POLICY "Only admins can update site settings" ON site_settings FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Only admins can insert site settings" ON site_settings;
CREATE POLICY "Only admins can insert site settings" ON site_settings FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'editor')));

-- Site Terms
ALTER TABLE site_terms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access for all users" ON site_terms;
CREATE POLICY "Allow read access for all users" ON site_terms FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert for authenticated users with editor or admin role" ON site_terms;
CREATE POLICY "Allow insert for authenticated users with editor or admin role" ON site_terms FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('editor', 'admin'));
DROP POLICY IF EXISTS "Allow update for authenticated users with editor or admin role" ON site_terms;
CREATE POLICY "Allow update for authenticated users with editor or admin role" ON site_terms FOR UPDATE USING (auth.role() = 'authenticated' AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('editor', 'admin'));
DROP POLICY IF EXISTS "Allow delete for authenticated users with admin role" ON site_terms;
CREATE POLICY "Allow delete for authenticated users with admin role" ON site_terms FOR DELETE USING (auth.role() = 'authenticated' AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_landing_layouts_updated_at ON landing_layouts;
CREATE TRIGGER update_landing_layouts_updated_at BEFORE UPDATE ON landing_layouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_landing_versions_updated_at ON landing_versions;
CREATE TRIGGER update_landing_versions_updated_at BEFORE UPDATE ON landing_versions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_product_comparisons_updated_at ON product_comparisons;
CREATE TRIGGER update_product_comparisons_updated_at BEFORE UPDATE ON product_comparisons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_product_support_pages_updated_at ON product_support_pages;
CREATE TRIGGER update_product_support_pages_updated_at BEFORE UPDATE ON product_support_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_saved_comparisons_updated_at ON saved_comparisons;
CREATE TRIGGER update_saved_comparisons_updated_at BEFORE UPDATE ON saved_comparisons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trigger_update_product_catalogs_updated_at ON product_catalogs;
CREATE TRIGGER trigger_update_product_catalogs_updated_at BEFORE UPDATE ON product_catalogs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_site_terms_updated_at ON site_terms;
CREATE TRIGGER update_site_terms_updated_at BEFORE UPDATE ON site_terms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar profile automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar profile automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para garantir apenas uma versão default por layout
CREATE OR REPLACE FUNCTION ensure_single_default_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE landing_versions
    SET is_default = false
    WHERE layout_id = NEW.layout_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_default_version_trigger ON landing_versions;
CREATE TRIGGER ensure_single_default_version_trigger
  BEFORE INSERT OR UPDATE ON landing_versions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_version();

-- ==========================================
-- DADOS INICIAIS
-- ==========================================

-- Inserir configurações padrão do site
INSERT INTO site_settings (key, value, description, site_name) VALUES
('general', '{}', 'Configurações gerais do site', 'Smart Time Prime')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- FIM DO SCHEMA
-- ==========================================

