-- ==========================================
-- Setup: tabela site_terms (Termos e Políticas)
-- Execute no Supabase SQL Editor se a tabela ainda não existir.
-- A aplicação preenche os termos padrão ao acessar o Dashboard > Termos.
-- ==========================================

-- Tabela de termos (políticas, termos de uso, etc.)
CREATE TABLE IF NOT EXISTS public.site_terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  icon TEXT DEFAULT 'file-text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_terms_key ON public.site_terms(key);

-- Função para updated_at (usada pelo trigger)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RLS (leitura pública; escrita apenas admin/editor)
ALTER TABLE public.site_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access for all users" ON public.site_terms;
CREATE POLICY "Allow read access for all users" ON public.site_terms
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users with editor or admin role" ON public.site_terms;
CREATE POLICY "Allow insert for authenticated users with editor or admin role" ON public.site_terms
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('editor', 'admin'))
  );

DROP POLICY IF EXISTS "Allow update for authenticated users with editor or admin role" ON public.site_terms;
CREATE POLICY "Allow update for authenticated users with editor or admin role" ON public.site_terms
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('editor', 'admin'))
  );

DROP POLICY IF EXISTS "Allow delete for authenticated users with admin role" ON public.site_terms;
CREATE POLICY "Allow delete for authenticated users with admin role" ON public.site_terms
  FOR DELETE USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_site_terms_updated_at ON public.site_terms;
CREATE TRIGGER update_site_terms_updated_at
  BEFORE UPDATE ON public.site_terms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comentário
COMMENT ON TABLE public.site_terms IS 'Termos e políticas do site (uso, privacidade, assinatura, etc.). Conteúdo padrão é inserido pela aplicação ao abrir Dashboard > Termos.';
