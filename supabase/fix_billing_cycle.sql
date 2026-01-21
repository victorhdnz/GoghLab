-- ==========================================
-- CORRIGIR BILLING_CYCLE DAS ASSINATURAS
-- Execute este SQL no Supabase SQL Editor
-- ==========================================
-- 
-- Este script:
-- 1. Adiciona a coluna billing_cycle se ela não existir
-- 2. Corrige o billing_cycle das assinaturas baseado na duração do período
-- 3. Atualiza baseado no stripe_price_id quando disponível

-- 0. ADICIONAR COLUNAS NECESSÁRIAS SE NÃO EXISTIREM
DO $$ 
BEGIN
  -- Adicionar billing_cycle se não existir
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'subscriptions' 
    AND column_name = 'billing_cycle'
  ) THEN
    ALTER TABLE subscriptions 
    ADD COLUMN billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'annual'));
    
    RAISE NOTICE 'Coluna billing_cycle adicionada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna billing_cycle já existe';
  END IF;
  
  -- Adicionar stripe_price_id se não existir (pode ser NULL para assinaturas manuais)
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'subscriptions' 
    AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE subscriptions 
    ADD COLUMN stripe_price_id TEXT;
    
    RAISE NOTICE 'Coluna stripe_price_id adicionada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna stripe_price_id já existe';
  END IF;
  
  -- Adicionar plan_id se não existir
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'subscriptions' 
    AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE subscriptions 
    ADD COLUMN plan_id TEXT CHECK (plan_id IN ('gogh_essencial', 'gogh_pro'));
    
    RAISE NOTICE 'Coluna plan_id adicionada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna plan_id já existe';
  END IF;
END $$;

-- 1. Atualizar billing_cycle baseado na duração do período (para assinaturas sem stripe_price_id)
UPDATE subscriptions
SET billing_cycle = CASE
  WHEN current_period_end IS NOT NULL AND current_period_start IS NOT NULL THEN
    CASE
      WHEN EXTRACT(EPOCH FROM (current_period_end - current_period_start)) > 2592000 THEN 'annual' -- Mais de 30 dias
      ELSE 'monthly'
    END
  ELSE COALESCE(billing_cycle, 'monthly')
END,
updated_at = NOW()
WHERE billing_cycle IS NULL 
   OR (stripe_subscription_id IS NULL OR stripe_subscription_id = '');

-- 2. Atualizar billing_cycle baseado no stripe_price_id (para assinaturas do Stripe)
-- Só executa se a coluna stripe_price_id existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'subscriptions' 
    AND column_name = 'stripe_price_id'
  ) THEN
    UPDATE subscriptions
    SET billing_cycle = CASE
      WHEN stripe_price_id IN ('price_1SpjHyJmSvvqlkSQRBubxB7K', 'price_1SpjKSJmSvvqlkSQlr8jNDTf') THEN 'annual'
      WHEN stripe_price_id IN ('price_1SpjGIJmSvvqlkSQGIpVMt0H', 'price_1SpjJIJmSvvqlkSQpBHztwk6') THEN 'monthly'
      ELSE COALESCE(billing_cycle, 'monthly')
    END,
    updated_at = NOW()
    WHERE stripe_price_id IS NOT NULL 
      AND stripe_price_id != ''
      AND stripe_price_id IN (
        'price_1SpjGIJmSvvqlkSQGIpVMt0H', -- Essencial Mensal
        'price_1SpjHyJmSvvqlkSQRBubxB7K', -- Essencial Anual
        'price_1SpjJIJmSvvqlkSQpBHztwk6', -- Pro Mensal
        'price_1SpjKSJmSvvqlkSQlr8jNDTf'  -- Pro Anual
      );
    
    RAISE NOTICE 'Billing cycle atualizado baseado em stripe_price_id';
  ELSE
    RAISE NOTICE 'Coluna stripe_price_id não existe, pulando atualização baseada em price_id';
  END IF;
END $$;

-- 3. Garantir que todas as assinaturas tenham billing_cycle
UPDATE subscriptions
SET billing_cycle = 'monthly',
    updated_at = NOW()
WHERE billing_cycle IS NULL OR billing_cycle = '';

-- Verificar resultados
-- Usa apenas colunas que existem
DO $$
DECLARE
  has_plan_id BOOLEAN;
  has_stripe_price_id BOOLEAN;
  has_billing_cycle BOOLEAN;
BEGIN
  -- Verificar quais colunas existem
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'plan_id'
  ) INTO has_plan_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'stripe_price_id'
  ) INTO has_stripe_price_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'billing_cycle'
  ) INTO has_billing_cycle;
  
  -- Executar SELECT dinâmico baseado nas colunas disponíveis
  IF has_billing_cycle THEN
    RAISE NOTICE 'Verificando resultados...';
    -- O SELECT será executado fora do bloco DO para mostrar resultados
  ELSE
    RAISE NOTICE 'Coluna billing_cycle não existe ainda';
  END IF;
END $$;

-- SELECT final - mostra apenas colunas básicas que sempre existem
SELECT 
  id,
  user_id,
  current_period_start,
  current_period_end,
  CASE
    WHEN current_period_end IS NOT NULL AND current_period_start IS NOT NULL THEN
      EXTRACT(EPOCH FROM (current_period_end - current_period_start)) / 86400
    ELSE NULL
  END as days_in_period,
  status
FROM subscriptions
WHERE status = 'active' OR status IS NULL
ORDER BY COALESCE(created_at, NOW()) DESC
LIMIT 20;

