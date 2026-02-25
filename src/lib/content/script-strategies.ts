export type ScriptStrategyKey =
  | 'classic_4_blocks'
  | 'hook_problem_solution_cta'
  | 'pas'
  | 'aida'
  | 'story_offer_cta'

export type ScriptStrategy = {
  key: ScriptStrategyKey
  label: string
  description: string
  steps: string[]
}

export const DEFAULT_SCRIPT_STRATEGY_KEY: ScriptStrategyKey = 'classic_4_blocks'

export const SCRIPT_STRATEGIES: ScriptStrategy[] = [
  {
    key: 'classic_4_blocks',
    label: 'Clássica (Gancho + Desenvolvimento + Exemplo + CTA)',
    description: 'Estrutura equilibrada para vídeos educativos e de autoridade.',
    steps: ['Gancho', 'Desenvolvimento', 'Demonstração/Exemplo', 'CTA final'],
  },
  {
    key: 'hook_problem_solution_cta',
    label: 'Gancho + Dor + Virada + Solução + CTA',
    description: 'Boa para conversão e conexão com dores reais do público.',
    steps: ['Gancho', 'Problema/Dor', 'Insight/Virada de chave', 'Solução', 'CTA final'],
  },
  {
    key: 'pas',
    label: 'PAS (Problema + Agitação + Solução)',
    description: 'Estrutura de copy para gerar urgência e ação.',
    steps: ['Gancho', 'Problema', 'Agitação', 'Solução', 'CTA final'],
  },
  {
    key: 'aida',
    label: 'AIDA (Atenção + Interesse + Desejo + Ação)',
    description: 'Clássica de marketing para conteúdo persuasivo.',
    steps: ['Atenção', 'Interesse', 'Desejo', 'Ação (CTA)'],
  },
  {
    key: 'story_offer_cta',
    label: 'Storytelling (Contexto + Conflito + Virada + Oferta + CTA)',
    description: 'Ideal para conteúdo emocional e de posicionamento.',
    steps: ['Gancho', 'Contexto/História', 'Conflito', 'Virada', 'Oferta', 'CTA final'],
  },
]

export function getScriptStrategy(key?: string | null): ScriptStrategy {
  if (!key) return SCRIPT_STRATEGIES[0]
  return SCRIPT_STRATEGIES.find((strategy) => strategy.key === key) || SCRIPT_STRATEGIES[0]
}

export function buildScriptStructureInstruction(key?: string | null) {
  const selected = getScriptStrategy(key)
  return {
    key: selected.key,
    label: selected.label,
    description: selected.description,
    steps: selected.steps,
    promptInstruction:
      `- Estruture o roteiro seguindo EXATAMENTE esta sequência de blocos: ${selected.steps.join(' -> ')}.\n` +
      '- Use emoji APENAS no início do título de cada bloco.\n' +
      '- Não repita blocos com o mesmo nome e não duplique títulos de seção.\n',
  }
}

