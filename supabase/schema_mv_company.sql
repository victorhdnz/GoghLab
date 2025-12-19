-- ==========================================
-- SCHEMA COMPLETO - MV COMPANY (Portfolio de Serviços Digitais)
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
-- SERVICES (Serviços Digitais)
-- ==========================================
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT,
  full_description TEXT,
  category TEXT, -- Ex: "Desenvolvimento", "Marketing", "Conteúdo", "Tráfego Pago"
  tags TEXT[],
  cover_image TEXT,
  images TEXT[] DEFAULT '{}',
  video_url TEXT,
  price_range TEXT, -- Ex: "A partir de R$ 1.500" ou "Sob consulta"
  delivery_time TEXT, -- Ex: "15-30 dias"
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- SERVICE TESTIMONIALS (Avaliações de Clientes)
-- ==========================================
CREATE TABLE IF NOT EXISTS service_testimonials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_company TEXT,
  client_photo TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  testimonial_text TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PORTFOLIO LAYOUTS (Layouts do Portfolio Principal)
-- ==========================================
CREATE TABLE IF NOT EXISTS portfolio_layouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  custom_url TEXT UNIQUE,
  theme_colors JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PORTFOLIO PAGES (Páginas Detalhadas de Serviços)
-- ==========================================
CREATE TABLE IF NOT EXISTS portfolio_pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}', -- Estrutura similar ao editor de landing pages
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PORTFOLIO ANALYTICS (Analytics do Portfolio)
-- ==========================================
CREATE TABLE IF NOT EXISTS portfolio_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  layout_id UUID REFERENCES portfolio_layouts(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'click', 'scroll', 'time_on_page', 'exit', 'conversion', 'service_view', 'contact_click')),
  event_data JSONB DEFAULT '{}',
  user_agent TEXT,
  referrer TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- COMPANY COMPARISONS (Comparador de Empresas)
-- ==========================================
CREATE TABLE IF NOT EXISTS company_comparisons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL, -- Nome da empresa comparada (fictícia)
  slug TEXT UNIQUE NOT NULL,
  logo TEXT,
  description TEXT,
  comparison_topics JSONB DEFAULT '[]', -- Array de tópicos de comparação
  mv_company_features JSONB DEFAULT '[]', -- Features da MV Company (check/X)
  competitor_features JSONB DEFAULT '[]', -- Features do concorrente (check/X)
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
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
  comparison_id UUID REFERENCES company_comparisons(id) ON DELETE CASCADE,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_featured ON services(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_service_testimonials_service_id ON service_testimonials(service_id);
CREATE INDEX IF NOT EXISTS idx_service_testimonials_featured ON service_testimonials(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_portfolio_layouts_slug ON portfolio_layouts(slug);
CREATE INDEX IF NOT EXISTS idx_portfolio_layouts_custom_url ON portfolio_layouts(custom_url);
CREATE INDEX IF NOT EXISTS idx_portfolio_pages_service_id ON portfolio_pages(service_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_pages_slug ON portfolio_pages(slug);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_layout_id ON portfolio_analytics(layout_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_service_id ON portfolio_analytics(service_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_event_type ON portfolio_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_created_at ON portfolio_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_company_comparisons_slug ON company_comparisons(slug);
CREATE INDEX IF NOT EXISTS idx_company_comparisons_active ON company_comparisons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_saved_comparisons_slug ON saved_comparisons(slug);
CREATE INDEX IF NOT EXISTS idx_saved_comparisons_comparison_id ON saved_comparisons(comparison_id);
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

-- Services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Services are viewable by everyone" ON services;
CREATE POLICY "Services are viewable by everyone" ON services FOR SELECT USING (is_active = true OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Only admins can insert services" ON services;
CREATE POLICY "Only admins can insert services" ON services FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
DROP POLICY IF EXISTS "Only admins can update services" ON services;
CREATE POLICY "Only admins can update services" ON services FOR UPDATE USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Only admins can delete services" ON services;
CREATE POLICY "Only admins can delete services" ON services FOR DELETE USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Service Testimonials
ALTER TABLE service_testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Testimonials are viewable by everyone" ON service_testimonials;
CREATE POLICY "Testimonials are viewable by everyone" ON service_testimonials FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Only admins can manage testimonials" ON service_testimonials;
CREATE POLICY "Only admins can manage testimonials" ON service_testimonials FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'editor')));

-- Portfolio Layouts
ALTER TABLE portfolio_layouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Portfolio layouts are viewable by everyone" ON portfolio_layouts;
CREATE POLICY "Portfolio layouts are viewable by everyone" ON portfolio_layouts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Portfolio layouts are insertable by admins and editors" ON portfolio_layouts;
CREATE POLICY "Portfolio layouts are insertable by admins and editors" ON portfolio_layouts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Portfolio layouts are updatable by admins and editors" ON portfolio_layouts;
CREATE POLICY "Portfolio layouts are updatable by admins and editors" ON portfolio_layouts FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Portfolio layouts are deletable by admins and editors" ON portfolio_layouts;
CREATE POLICY "Portfolio layouts are deletable by admins and editors" ON portfolio_layouts FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));

-- Portfolio Pages
ALTER TABLE portfolio_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Portfolio pages are viewable by everyone" ON portfolio_pages;
CREATE POLICY "Portfolio pages are viewable by everyone" ON portfolio_pages FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Portfolio pages are insertable by admins and editors" ON portfolio_pages;
CREATE POLICY "Portfolio pages are insertable by admins and editors" ON portfolio_pages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Portfolio pages are updatable by admins and editors" ON portfolio_pages;
CREATE POLICY "Portfolio pages are updatable by admins and editors" ON portfolio_pages FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Portfolio pages are deletable by admins and editors" ON portfolio_pages;
CREATE POLICY "Portfolio pages are deletable by admins and editors" ON portfolio_pages FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));

-- Portfolio Analytics
ALTER TABLE portfolio_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Portfolio analytics are insertable by everyone" ON portfolio_analytics;
CREATE POLICY "Portfolio analytics are insertable by everyone" ON portfolio_analytics FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Portfolio analytics are viewable by admins and editors" ON portfolio_analytics;
CREATE POLICY "Portfolio analytics are viewable by admins and editors" ON portfolio_analytics FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));

-- Company Comparisons
ALTER TABLE company_comparisons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Company comparisons are viewable by everyone" ON company_comparisons;
CREATE POLICY "Company comparisons are viewable by everyone" ON company_comparisons FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Company comparisons are insertable by admins and editors" ON company_comparisons;
CREATE POLICY "Company comparisons are insertable by admins and editors" ON company_comparisons FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Company comparisons are updatable by admins and editors" ON company_comparisons;
CREATE POLICY "Company comparisons are updatable by admins and editors" ON company_comparisons FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));
DROP POLICY IF EXISTS "Company comparisons are deletable by admins and editors" ON company_comparisons;
CREATE POLICY "Company comparisons are deletable by admins and editors" ON company_comparisons FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')));

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
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_portfolio_layouts_updated_at ON portfolio_layouts;
CREATE TRIGGER update_portfolio_layouts_updated_at BEFORE UPDATE ON portfolio_layouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_portfolio_pages_updated_at ON portfolio_pages;
CREATE TRIGGER update_portfolio_pages_updated_at BEFORE UPDATE ON portfolio_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_company_comparisons_updated_at ON company_comparisons;
CREATE TRIGGER update_company_comparisons_updated_at BEFORE UPDATE ON company_comparisons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_saved_comparisons_updated_at ON saved_comparisons;
CREATE TRIGGER update_saved_comparisons_updated_at BEFORE UPDATE ON saved_comparisons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
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

-- Função para garantir apenas um layout default por portfolio
CREATE OR REPLACE FUNCTION ensure_single_default_portfolio_layout()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE portfolio_layouts
    SET is_default = false
    WHERE id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_default_portfolio_layout_trigger ON portfolio_layouts;
CREATE TRIGGER ensure_single_default_portfolio_layout_trigger
  BEFORE INSERT OR UPDATE ON portfolio_layouts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_portfolio_layout();

-- ==========================================
-- DADOS INICIAIS
-- ==========================================

-- Inserir configurações padrão do site
INSERT INTO site_settings (key, value, description, site_name) VALUES
('general', '{}', 'Configurações gerais do site', 'MV Company')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- FIM DO SCHEMA
-- ==========================================

