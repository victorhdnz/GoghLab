-- ==========================================
-- POLÍTICAS RLS PARA BUCKET: videos
-- Execute este SQL no Supabase SQL Editor
-- ==========================================

-- 1. Permitir que admins/editores façam upload
DROP POLICY IF EXISTS "Admins podem fazer upload em videos" ON storage.objects;
CREATE POLICY "Admins podem fazer upload em videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos' 
  AND auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'editor'))
);

-- 2. Permitir que todos vejam os vídeos (bucket público)
DROP POLICY IF EXISTS "Todos podem ver videos" ON storage.objects;
CREATE POLICY "Todos podem ver videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- 3. Permitir que admins/editores deletem vídeos
DROP POLICY IF EXISTS "Admins podem deletar de videos" ON storage.objects;
CREATE POLICY "Admins podem deletar de videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos' 
  AND auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'editor'))
);

-- Verificar se as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%videos%'
ORDER BY policyname;

