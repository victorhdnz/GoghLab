-- ==========================================
-- CONFIGURAR SUPABASE STORAGE BUCKETS E POLICIES
-- EDITOR DE LANDING PAGE / COMPARADOR DE PRODUTOS
-- ==========================================

-- Nota: Os buckets devem ser criados manualmente no Supabase Dashboard
-- Storage → New Bucket → Nome: products, banners, profiles, videos (todos PUBLIC)

-- ==========================================
-- RLS POLICIES PARA BUCKET: products
-- ==========================================
DROP POLICY IF EXISTS "Admins podem fazer upload em products" ON storage.objects;
CREATE POLICY "Admins podem fazer upload em products"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products' 
  AND auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'editor'))
);

DROP POLICY IF EXISTS "Todos podem ver imagens de products" ON storage.objects;
CREATE POLICY "Todos podem ver imagens de products"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Admins podem deletar de products" ON storage.objects;
CREATE POLICY "Admins podem deletar de products"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products' 
  AND auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'editor'))
);

-- ==========================================
-- RLS POLICIES PARA BUCKET: banners
-- ==========================================
DROP POLICY IF EXISTS "Admins podem fazer upload em banners" ON storage.objects;
CREATE POLICY "Admins podem fazer upload em banners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'banners' 
  AND auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'editor'))
);

DROP POLICY IF EXISTS "Todos podem ver imagens de banners" ON storage.objects;
CREATE POLICY "Todos podem ver imagens de banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "Admins podem deletar de banners" ON storage.objects;
CREATE POLICY "Admins podem deletar de banners"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'banners' 
  AND auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'editor'))
);

-- ==========================================
-- RLS POLICIES PARA BUCKET: profiles
-- ==========================================
DROP POLICY IF EXISTS "Usuarios podem fazer upload de avatar" ON storage.objects;
CREATE POLICY "Usuarios podem fazer upload de avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Todos podem ver avatares" ON storage.objects;
CREATE POLICY "Todos podem ver avatares"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

DROP POLICY IF EXISTS "Usuarios podem deletar proprio avatar" ON storage.objects;
CREATE POLICY "Usuarios podem deletar proprio avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ==========================================
-- RLS POLICIES PARA BUCKET: videos
-- ==========================================
DROP POLICY IF EXISTS "Admins podem fazer upload em videos" ON storage.objects;
CREATE POLICY "Admins podem fazer upload em videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos' 
  AND auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'editor'))
);

DROP POLICY IF EXISTS "Todos podem ver videos" ON storage.objects;
CREATE POLICY "Todos podem ver videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "Admins podem deletar de videos" ON storage.objects;
CREATE POLICY "Admins podem deletar de videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos' 
  AND auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'editor'))
);

