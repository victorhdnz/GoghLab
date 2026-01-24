-- ==========================================
-- ADICIONAR COLUNA stripe_customer_id À TABELA service_subscriptions
-- ==========================================
-- Este script adiciona a coluna stripe_customer_id à tabela service_subscriptions
-- para permitir o gerenciamento de assinaturas de serviço através do portal do Stripe
-- ==========================================
-- INSTRUÇÕES: Execute este script no SQL Editor do Supabase Dashboard
-- ==========================================

-- Adicionar coluna stripe_customer_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'service_subscriptions' 
    AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.service_subscriptions
    ADD COLUMN stripe_customer_id text;
    
    RAISE NOTICE 'Coluna stripe_customer_id adicionada à tabela service_subscriptions.';
  ELSE
    RAISE NOTICE 'Coluna stripe_customer_id já existe na tabela service_subscriptions.';
  END IF;
END $$;

