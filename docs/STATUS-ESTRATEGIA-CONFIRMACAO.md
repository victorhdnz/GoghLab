# Confirmação: Status alinhado à estratégia e visão de crescimento

Este documento confirma como o **Status e decisões** do Gogh Analytics Ads está desenhado para ser **estratégico**, **analítico** e **orientado a crescimento**, e o que já está implementado.

---

## 1. Dados e diagnóstico

- **Só gera status quando há dados reais:** impressões, valor investido ou compras (pelo menos um). Sem dados nos criativos, não mostra score saudável nem "Pode escalar".
- **Análise opcional por planejamento:** Se o cliente preenche Planejamento de valores (preço, custo, meta de lucro), o status usa **lucro, CPA limite e "Dentro da meta"**. Se não preenche, a análise é só por **métricas de criativos** (frequência, CTR, conversão), sem mensagens de lucro/CPA.
- **Métricas calculadas:** Frequência, CTR, Conversão, CPM, CPC, CPA, ROAS a partir dos dados dos criativos (soma quando há vários).

---

## 2. Estratégia por investimento (tier)

- **Nível definido pelo investimento médio/dia:** Baixo (até ~R$ 50/dia), Médio (R$ 50–300/dia), Alto (acima de ~R$ 300/dia).
- **Investimento médio = total gasto ÷ dias desde o início da campanha** (data de início usada para não recomendar no vácuo).
- **Recomendação de criativos por tier:** 2–3 (baixo), 3–5 (médio), 4–6 (alto). Alertas quando há 1 criativo só ou menos que o mínimo do tier.
- **Tier só é ajustado automaticamente após 3+ dias** de campanha, para não classificar por 1–2 dias de dado.

---

## 3. Fases da campanha (Plano de otimização)

- **Dia 1–5 (aprendizado):** Não sugerir valor de aumento; mensagem "CPA dentro do limite" ou "Métricas dentro da meta" com "não altere o orçamento" e "a partir do dia 18 o sistema poderá sugerir aumento". **"Pode escalar" só aparece a partir do dia 18**, quando há sugestão concreta em R$/dia.
- **Dia 7 (1ª análise):** Textos do plano orientam a analisar métricas e pausar piores criativos.
- **Dia 10–14:** Orientação a adicionar criativos; meta de quantidade usa o tier (min–max criativos).
- **Dia 18+:** Liberada a sugestão de **aumento de investimento** (15–20% ao dia) com valor em R$/dia calculado.

---

## 4. Score e gravidade

- **Score 0–100** a partir de: frequência, CTR, conversão, CPA (quando ROI ativo) e lucro (quando ROI ativo).
- **Status geral:** saudável (80+), estável (60+), alerta (40+), crítica (&lt;40).
- **Alertas por tipo:** success (verde), warning (amarelo), danger (vermelho); agrupados por ação para evitar repetição.

---

## 5. Recomendações por contexto

- **Frequência alta (≥4):** "Trocar criativo"; entre 3 e 4 "Avaliar novo criativo"; 2,5–3 "Acompanhar".
- **CTR baixo:** "Testar novo criativo" com meta (≥1% ou ≥1,5%).
- **Conversão baixa:** "Revisar oferta ou página" com meta (≥1,5%).
- **Com planejamento:** "Dentro da meta" quando lucro e CPA ok; "Não escalar" quando CPA &gt; limite, com lucro real por venda e meta quando aplicável.
- **Por criativo:** alertas por nome (trocar, avaliar, testar, pausar/excluir quando frequência alta ou CTR baixo).

---

## 6. O que já está “impecável” na lógica

- Diagnóstico só com dados; sem dados não mostra saudável.
- Planejamento de valores opcional e espelhado (com/sem preenchimento).
- Tier por investimento e recomendação de quantidade de criativos.
- Fases (dias 1–5, 7, 10–14, 18+) respeitadas nas mensagens e na sugestão de aumento.
- "Pode escalar" apenas com sugestão concreta (dia 18+); antes disso, "CPA dentro do limite" / "Métricas dentro da meta" sem contradição.
- Textos objetivos e sem redundância (ex.: bloco Estratégia com "Seu investimento médio" e "Faixa deste nível" separados).

---

## 7. Possíveis evoluções (não obrigatórias)

- **Mínimo de dados para decidir:** Ex.: não recomendar "Trocar criativo" por CTR com menos de X impressões (evitar decisão com poucos dados).
- **Recomendações condicionadas à fase:** Ex.: em dia 1–5 não recomendar "Pausar criativo" só por métrica; priorizar "Acompanhar" até dia 7.
- **Priorização explícita:** Ordenar ou destacar "próximo passo" (ex.: em fase 10–14 priorizar "Adicionar criativos" sobre "Aumentar investimento").
- **Histórico/tendência:** Guardar snapshots para comparar CPA/CTR no tempo e mensagens tipo "CPA subiu X% na última semana".

---

## Conclusão

O status **já está alinhado à estratégia** (fases, tier, planejamento opcional) e **à visão de crescimento** (escalar só quando há sugestão concreta; antes disso, manter e otimizar). A remoção do título "Painel Inteligente de Análise de Campanhas" no dashboard foi feita; o painel de campanhas do admin segue com título "Painel de Campanhas" e subtítulo curto.
