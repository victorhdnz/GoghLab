-- ==========================================
-- VERIFICAR BILLING_CYCLE DAS ASSINATURAS
-- Execute este SQL para verificar se tudo está correto
-- ==========================================

-- Verificar todas as assinaturas ativas com seus billing_cycles
SELECT 
  id,
  user_id,
  plan_id,
  billing_cycle,
  stripe_price_id,
  stripe_subscription_id,
  current_period_start,
  current_period_end,
  CASE
    WHEN current_period_end IS NOT NULL AND current_period_start IS NOT NULL THEN
      EXTRACT(EPOCH FROM (current_period_end - current_period_start)) / 86400
    ELSE NULL
  END as days_in_period,
  CASE
    WHEN current_period_end IS NOT NULL AND current_period_start IS NOT NULL THEN
      CASE
        WHEN EXTRACT(EPOCH FROM (current_period_end - current_period_start)) > 30 THEN 'annual'
        ELSE 'monthly'
      END
    ELSE 'unknown'
  END as inferred_billing_cycle,
  status,
  CASE
    WHEN billing_cycle IS NULL THEN '❌ SEM billing_cycle'
    WHEN current_period_end IS NOT NULL AND current_period_start IS NOT NULL THEN
      CASE
        WHEN EXTRACT(EPOCH FROM (current_period_end - current_period_start)) > 30 
             AND billing_cycle != 'annual' THEN '⚠️ INCONSISTENTE (deveria ser annual)'
        WHEN EXTRACT(EPOCH FROM (current_period_end - current_period_start)) <= 30 
             AND billing_cycle != 'monthly' THEN '⚠️ INCONSISTENTE (deveria ser monthly)'
        ELSE '✅ OK'
      END
    ELSE '❓ Não é possível verificar'
  END as status_check
FROM subscriptions
WHERE status = 'active' OR status IS NULL
ORDER BY created_at DESC;

