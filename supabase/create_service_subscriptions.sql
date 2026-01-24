-- ==========================================
-- CRIAR TABELA service_subscriptions
-- ==========================================
-- INSTRUÇÕES: Execute este script no SQL Editor do Supabase Dashboard
-- ==========================================

CREATE TABLE IF NOT EXISTS public.service_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  status text NOT NULL DEFAULT 'active',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  current_period_start timestamptz,
  current_period_end timestamptz,
  plan_id text,
  plan_name text,
  selected_services text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_service_subscriptions_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_service_subscriptions_updated_at ON public.service_subscriptions;
CREATE TRIGGER set_service_subscriptions_updated_at
BEFORE UPDATE ON public.service_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.set_service_subscriptions_updated_at();

-- RLS
ALTER TABLE public.service_subscriptions ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver os próprios serviços
DROP POLICY IF EXISTS "service_subscriptions_select_own" ON public.service_subscriptions;
CREATE POLICY "service_subscriptions_select_own"
ON public.service_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Admin pode ver tudo
DROP POLICY IF EXISTS "service_subscriptions_select_admin" ON public.service_subscriptions;
CREATE POLICY "service_subscriptions_select_admin"
ON public.service_subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

