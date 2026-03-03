# Melhorias para uma ferramenta de análise de anúncios mais estratégica e inteligente

Este documento propõe evoluções para que a análise não seja só reativa (métricas atuais) e curto prazo, mas **pensada em estratégia**, **fases da campanha** e **médio/longo prazo**.

---

## 1. Unificar Status e Plano de otimização (estratégia única)

**Problema hoje:** O **Status** (score, alertas) e o **Plano de otimização** (dias 1–5, 7, 10–14, 18+) estão separados. As recomendações não dizem explicitamente “para a fase em que você está, a estratégia é X”.

**Melhoria:**
- Toda recomendação do Status deveria **referenciar a fase atual** quando fizer sentido.
- Exemplos:
  - Fase aprendizado (1–5): mesmo que o CPA esteja bom, não mostrar “Pode escalar” com valor; mostrar “Fase de aprendizado — aguarde dia 7 para primeira análise.” (já feito em parte).
  - Fase dia 7: priorizar “Analise quais criativos pausar” e “Atualize os dados para comparar”.
  - Fase 10–14: priorizar “Adicionar 1–2 criativos” antes de “Aumentar investimento”.
  - Fase 18+: liberar “Pode aumentar R$ X a R$ Y/dia” e “Manter 4–5 criativos ativos”.
- **Regra de ouro:** O texto do Status e das recomendações deve **espelhar a estratégia do Plano** para aquele dia/fase.

---

## 2. Recomendações condicionadas à fase (não só aos números)

**Problema hoje:** Alertas são calculados só por métricas (frequência, CTR, CPA). Em dia 1–5, por exemplo, “Trocar criativo” por frequência alta pode ser prematuro (algoritmo ainda aprendendo).

**Melhoria:**
- **Fase aprendizado (1–5):**
  - Não recomendar “Pausar ou excluir criativo” só por desempenho; no máximo “Acompanhar criativo X (frequência alta). Decisão após dia 7.”
  - Não sugerir valor de aumento de investimento (já implementado).
- **Fase dia 7 (6–9):**
  - Habilitar recomendações de “Pausar piores criativos” e “Manter pelo menos 3 ativos”.
  - Ainda não sugerir valor de aumento (só a partir do dia 18).
- **Fase 10–14:**
  - Se há poucos criativos (< 3), priorizar alerta “Adicione criativos (estratégia dia 10–14)” acima de “Pode escalar”.
  - Manter “Pode escalar” apenas com texto genérico até dia 18.
- **Fase 18+:**
  - Liberar todas as recomendações: valor de aumento, pausar/trocar criativo, manter 4–5 ativos.

Assim a ferramenta **pensa com estratégia** (fase) e não só com snapshot (métricas).

---

## 3. Quantidade de criativos como parte da estratégia

**Problema hoje:** O Plano fala em “3–5 criativos ativos”, mas o Status não usa o número de criativos para nada.

**Melhoria:**
- **Menos de 3 criativos** (e campanha após dia 7): alerta “Estratégia: mantenha pelo menos 3 criativos ativos. Adicione criativos para o algoritmo performar melhor.”
- **1 criativo só** (e fase 10+): alerta mais forte “Risco de saturação com 1 criativo. Adicione 2–3 criativos.”
- **Fase 18+ e 4–5 criativos:** mensagem positiva “Quantidade de criativos adequada (4–5). Mantenha o ciclo: reponha os que forem pausados.”

Isso torna a “estratégia” explícita e acionável.

---

## 4. Dados mínimos para decidir (evitar decisões prematuras)

**Problema hoje:** Basta ter impressões > 0 ou investimento > 0 para gerar score e alertas. Com 100 impressões e 2 cliques, já pode aparecer “CTR baixo” e “Testar novo criativo”, o que é estatisticamente frágil.

**Melhoria:**
- Definir **mínimos por tipo de decisão** (constantes ou configuráveis):
  - Para falar de **CTR**: ex.: mínimo 1.000 impressões (ou 500).
  - Para falar de **conversão**: ex.: mínimo 100 cliques (ou 50).
  - Para falar de **CPA / escalar**: ex.: mínimo 20–30 compras (ou valor investido mínimo).
- Se os dados estiverem abaixo do mínimo:
  - Ainda mostrar métricas e score, mas **suavizar a linguagem**: “CTR X% (poucos dados ainda; atualize em alguns dias para uma leitura mais estável).”
  - Ou marcar o alerta como “Poucos dados — acompanhe” em vez de “Testar novo criativo” quando impressões < 1000.

Assim a ferramenta evita recomendações **superficiais** por amostra pequena.

---

## 5. Histórico e tendências (médio/longo prazo)

**Problema hoje:** Só existe o estado atual (snapshot). Não há como ver “CPA subiu ou caiu na última semana?” ou “O criativo melhorou ou piorou?”.

**Melhoria (médio prazo):**
- **Salvar snapshots** ao “Salvar na campanha” (ou periodicamente): por campanha/criativo, guardar data + métricas (impressões, cliques, investimento, compras, CPA, CTR, etc.).
- **Tela ou bloco “Evolução”:**
  - Gráfico ou tabela: métricas ao longo do tempo (por semana ou por data de snapshot).
  - Texto automático: “CPA esta semana: R$ X (semana passada: R$ Y). Tendência: subindo/estável/caindo.”
- **Recomendações com tendência:**
  - “CPA subiu 15% na última semana — vale revisar criativos ou oferta.”
  - “CTR está estável; conversão caiu — verifique página de destino.”

Isso adiciona **pensamento de médio prazo** (não só “hoje está bom/ruim”).

---

## 6. Priorização e conflito entre recomendações

**Problema hoje:** Várias recomendações podem aparecer juntas (ex.: “Dentro da meta”, “Pode escalar”, “Avaliar novo criativo”, “Pausar criativo X”). Não fica claro **o que fazer primeiro**.

**Melhoria:**
- Ordenar ou **priorizar** por:
  1. **Fase da campanha:** na fase 10–14, “Adicionar criativos” vem antes de “Aumentar investimento”.
  2. **Gravidade:** perigo (CPA > lucro) > aviso (CTR baixo) > sucesso (Dentro da meta).
  3. **Estratégia:** “Não alterar orçamento (fase aprendizado)” pode aparecer no topo em dia 1–5.
- Opcional: **Uma “ação principal”** por vez, por exemplo: “Próximo passo: [Adicionar 2 criativos]”, e o resto como “Outras observações”.

Assim a ferramenta **guia** em vez de só listar.

---

## 7. Objetivo da campanha (opcional)

**Problema hoje:** O sistema não sabe se o usuário quer “aumentar volume”, “manter CPA”, “testar criativos” ou “reduzir custo”. Todas as campanhas são tratadas igual.

**Melhoria:**
- Campo opcional **“Objetivo desta campanha”**: ex. “Escalar”, “Manter lucro”, “Testar criativos”, “Reduzir CPA”.
- Ajustar **mensagens** conforme o objetivo:
  - Objetivo “Escalar”: destacar “Pode aumentar R$ X/dia” quando aplicável.
  - Objetivo “Manter lucro”: destacar “CPA dentro do limite” e “Não aumentar orçamento se CPA subir”.
  - Objetivo “Testar criativos”: destacar “Adicione criativos” e “Compare desempenho entre criativos”.

Isso torna a recomendação **estratégica** e alinhada ao que o usuário quer.

---

## 8. Benchmarks configuráveis ou por vertical

**Problema hoje:** Os limites (CTR ≥ 1,5%, frequência < 4, etc.) são fixos no código. Nem todo negócio ou vertical tem os mesmos padrões.

**Melhoria:**
- **Constantes em um único lugar** (já em parte): FREQ_CRITICO, CTR_BOM, CONV_MEDIO, etc.
- Opcional: **Tela “Configurações de análise”** (ou por campanha) onde o usuário possa ajustar:
  - “CTR mínimo que considero bom”: 1% ou 1,5% ou 2%.
  - “Frequência máxima aceitável”: 3 ou 4.
  - “Conversão mínima esperada”: 1% ou 1,5%.
- Ou **presets por vertical**: “E-commerce”, “Serviços”, “Lead” com benchmarks diferentes.

Assim a “inteligência” se adapta ao tipo de negócio.

---

## 9. Resumo executivo em uma frase (opcional)

**Melhoria:**
- Além do score e dos alertas, mostrar **uma frase** que resume a estratégia do momento, por exemplo:
  - “Fase de aprendizado: não altere orçamento; volte no dia 7 para primeira análise.”
  - “Dia 12: CPA dentro da meta; adicione 1–2 criativos esta semana e depois avalie escalar.”
  - “Campanha estável há 20+ dias; pode aumentar 15–20% ao dia se quiser escalar.”

Isso ajuda a **pensar com estratégia** em um relance.

---

## 10. Ecossistema de estratégia por investimento (implementado)

A ferramenta passou a usar um **ecossistema de estratégia por faixa de investimento**:

- **Tier Baixo** (investimento médio até ~R$ 50/dia): **2–3 criativos** ativos.
- **Tier Médio** (R$ 50 a ~R$ 300/dia): **3–5 criativos** ativos.
- **Tier Alto** (acima de ~R$ 300/dia): **4–6 criativos** ativos.

O tier é definido automaticamente após **3+ dias** de campanha com dados (investimento total / dias). Antes disso, o padrão é **Médio**. O Plano de otimização e o Status passam a usar esse tier:

- Textos do plano (ex.: "Manter entre X e Y ativos") usam o min/max do tier.
- Alertas do Status avisam se há poucos criativos, só 1 criativo, ou muitos para o orçamento.
- Na UI, aparece "Estratégia: [Baixo|Médio|Alto]" com invest. médio/dia e a faixa recomendada de criativos.

Os limites (R$ 50 e R$ 300) e os min/max de criativos por tier estão em `STRATEGY_TIERS` em `src/app/analytics/page.tsx` e podem ser ajustados ou expandidos (ex.: novo tier "Muito alto", ou campo opcional "Orçamento diário planejado" para definir o tier desde o dia 1).

---

## 11. Ordem sugerida de implementação

| Prioridade | Item | Impacto | Esforço |
|------------|------|--------|---------|
| 1 | Recomendações condicionadas à fase (item 2) | Alto | Médio |
| 2 | Quantidade de criativos (item 3) | Alto | Baixo |
| 3 | Dados mínimos para decidir (item 4) | Alto | Médio |
| 4 | Priorização de recomendações (item 6) | Médio | Médio |
| 5 | Unificar linguagem Status + Plano (item 1) | Médio | Baixo |
| 6 | Resumo em uma frase (item 9) | Médio | Baixo |
| 7 | Objetivo da campanha (item 7) | Médio | Médio |
| 8 | Histórico e tendências (item 5) | Alto (longo prazo) | Alto |
| 9 | Benchmarks configuráveis (item 8) | Médio | Médio |

---

## Conclusão

Para a ferramenta ser **verdadeiramente inteligente** e **estratégica**, ela deve:

1. **Pensar em fases** (aprendizado → 1ª análise → novos criativos → contínuo), não só em números do dia.
2. **Exigir dados suficientes** antes de recomendar pausar, escalar ou trocar criativo.
3. **Considerar quantidade de criativos** (3–5 ativos) como parte da estratégia.
4. **Priorizar** o que fazer primeiro, alinhado à fase e à gravidade.
5. **(Futuro)** Usar histórico e tendências para recomendações de médio/longo prazo.
6. **(Futuro)** Permitir objetivo da campanha e benchmarks configuráveis para adaptar ao negócio.

Com isso, a análise deixa de ser só “métricas + regras fixas” e passa a **recomendar de acordo com estratégia, fase e contexto**.
