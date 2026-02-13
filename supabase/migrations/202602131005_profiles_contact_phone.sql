-- Número de contato para clientes de serviços personalizados (exibido em Gerenciar Membros).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_phone text;
COMMENT ON COLUMN public.profiles.contact_phone IS 'Telefone de contato cadastrado na área de Serviços personalizados; visível no dashboard em Gerenciar Membros.';
