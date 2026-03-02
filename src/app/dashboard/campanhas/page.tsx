'use client'

import { useState, useMemo } from 'react'
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Target,
  DollarSign,
  BarChart3,
  Zap,
  RefreshCw,
} from 'lucide-react'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/button'

type AlertLevel = 'success' | 'warning' | 'danger' | 'info'

interface DiagnosisItem {
  level: AlertLevel
  title: string
  message: string
  recommendation?: string
}

function toNum(v: string | number): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.'))
  return Number.isNaN(n) ? 0 : n
}

export default function CampanhasPage() {
  // --- DADOS DA CAMPANHA ---
  const [alcance, setAlcance] = useState('')
  const [impressoes, setImpressoes] = useState('')
  const [frequenciaManual, setFrequenciaManual] = useState('')
  const [cliquesLink, setCliquesLink] = useState('')
  const [taxaCliquesPct, setTaxaCliquesPct] = useState('')
  const [custoPorClique, setCustoPorClique] = useState('')
  const [compras, setCompras] = useState('')
  const [custoPorCompra, setCustoPorCompra] = useState('')
  const [valorInvestido, setValorInvestido] = useState('')
  const [valorConversaoCompras, setValorConversaoCompras] = useState('')
  const [roas, setRoas] = useState('')

  // --- DADOS FINANCEIROS INTERNOS ---
  const [precoPlano, setPrecoPlano] = useState('')
  const [custoFerramentasCliente, setCustoFerramentasCliente] = useState('')
  const [metaLucroCliente, setMetaLucroCliente] = useState('')
  const [orcamentoMensal, setOrcamentoMensal] = useState('')
  const [retencaoMeses, setRetencaoMeses] = useState('')

  // --- PARÂMETROS SAUDÁVEIS (ajustáveis) ---
  const [taxaCliquesMinSaudavel, setTaxaCliquesMinSaudavel] = useState('1')
  const [frequenciaMaxSaudavel, setFrequenciaMaxSaudavel] = useState('3')
  const [retornoMinimoIdeal, setRetornoMinimoIdeal] = useState('1.5')

  // --- SIMULADOR ---
  const [simOrcamento, setSimOrcamento] = useState('')
  const [simMultiplicador, setSimMultiplicador] = useState<'1.2' | '1.5' | '2'>('1.2')

  // --- UI ---
  const [showParams, setShowParams] = useState(false)
  const [showLtv, setShowLtv] = useState(true)

  const alc = toNum(alcance)
  const imp = toNum(impressoes)
  const freqManual = toNum(frequenciaManual)
  const cliques = toNum(cliquesLink)
  const taxaCliquesInput = toNum(taxaCliquesPct)
  const cpc = toNum(custoPorClique)
  const comprasNum = toNum(compras)
  const cpa = toNum(custoPorCompra)
  const investido = toNum(valorInvestido)
  const receitaConversao = toNum(valorConversaoCompras)
  const roasInput = toNum(roas)
  const preco = toNum(precoPlano)
  const custoFerr = toNum(custoFerramentasCliente)
  const metaLucro = toNum(metaLucroCliente)
  const orcamento = toNum(orcamentoMensal)
  const retencao = Math.max(0, toNum(retencaoMeses))

  // ---------- CÁLCULOS AUTOMÁTICOS ----------
  const calculos = useMemo(() => {
    const frequencia = alc > 0 && imp > 0 ? imp / alc : freqManual
    const taxaCliquesCalc = imp > 0 && cliques > 0 ? (cliques / imp) * 100 : taxaCliquesInput
    const taxaConversao = cliques > 0 && comprasNum > 0 ? (comprasNum / cliques) * 100 : 0
    const receitaTotal = receitaConversao > 0 ? receitaConversao : comprasNum * preco
    const lucroBrutoCliente = preco - custoFerr
    const lucroRealCliente = preco - custoFerr - cpa
    const custoMaxAceitavelCompra = preco - custoFerr - metaLucro
    const retornoMinIdeal = toNum(retornoMinimoIdeal)
    const roasCalculado = investido > 0 && receitaTotal > 0 ? receitaTotal / investido : roasInput
    const margemRealPct = receitaTotal > 0 ? (lucroRealCliente * comprasNum / receitaTotal) * 100 : 0
    const projLucroMensal = comprasNum > 0 ? (lucroRealCliente * comprasNum) : 0
    return {
      frequencia,
      taxaCliquesCalc,
      taxaConversao,
      receitaTotal,
      lucroBrutoCliente,
      lucroRealCliente,
      custoMaxAceitavelCompra,
      roasCalculado,
      margemRealPct,
      projLucroMensal,
      retornoMinIdeal,
    }
  }, [
    alc, imp, freqManual, cliques, taxaCliquesInput, comprasNum, preco, custoFerr, cpa, metaLucro,
    receitaConversao, investido, roasInput, retornoMinimoIdeal,
  ])

  // ---------- LTV ----------
  const ltv = useMemo(() => {
    if (retencao <= 0 || preco <= 0) return null
    const valorTotalCiclo = preco * retencao
    const custoMaxLtv = valorTotalCiclo - custoFerr * retencao - metaLucro * retencao
    const custoMaxPorCompraLtv = comprasNum > 0 ? custoMaxLtv / comprasNum : custoMaxLtv
    const retornoMinSaudavelLtv = preco > 0 ? valorTotalCiclo / preco : 0
    return {
      valorTotalCiclo,
      custoMaxPorCompraLtv,
      retornoMinSaudavelLtv,
    }
  }, [retencao, preco, custoFerr, metaLucro, comprasNum])

  // ---------- DIAGNÓSTICO ----------
  const diagnostico = useMemo((): DiagnosisItem[] => {
    const items: DiagnosisItem[] = []
    const taxaMin = toNum(taxaCliquesMinSaudavel) || 1
    const freqMax = toNum(frequenciaMaxSaudavel) || 3

    if (alc > 0 || imp > 0) {
      if (calculos.taxaCliquesCalc > 0 && calculos.taxaCliquesCalc < taxaMin) {
        items.push({
          level: 'danger',
          title: 'Criativo',
          message: `Taxa de cliques (${calculos.taxaCliquesCalc.toFixed(2)}%) abaixo do mínimo saudável (${taxaMin}%).`,
          recommendation: 'Criar novo criativo ou testar variações.',
        })
      } else if (calculos.taxaCliquesCalc >= taxaMin) {
        items.push({
          level: 'success',
          title: 'Criativo',
          message: `Taxa de cliques (${calculos.taxaCliquesCalc.toFixed(2)}%) dentro do esperado.`,
        })
      }

      if (calculos.frequencia > 0) {
        if (calculos.frequencia > freqMax) {
          items.push({
            level: 'warning',
            title: 'Saturação',
            message: `Frequência (${calculos.frequencia.toFixed(1)}) acima de ${freqMax}.`,
            recommendation: 'Anúncio pode estar saturando; considere renovar criativo ou público.',
          })
        } else {
          items.push({
            level: 'success',
            title: 'Frequência',
            message: `Frequência (${calculos.frequencia.toFixed(1)}) em nível aceitável.`,
          })
        }
      }
    }

    if (cliques > 0 && comprasNum > 0) {
      if (cliques > comprasNum * 10 && calculos.taxaConversao < 5) {
        items.push({
          level: 'warning',
          title: 'Conversão',
          message: 'Muitos cliques e poucas compras.',
          recommendation: 'Revisar página de oferta, copy e checkout.',
        })
      }
    }

    if (comprasNum > 0 && preco > 0) {
      if (calculos.custoMaxAceitavelCompra > 0 && cpa > calculos.custoMaxAceitavelCompra) {
        items.push({
          level: 'danger',
          title: 'Custo por compra',
          message: `CPA (R$ ${cpa.toFixed(2)}) acima do custo máximo saudável (R$ ${calculos.custoMaxAceitavelCompra.toFixed(2)}).`,
          recommendation: 'Reduzir CPA ou ajustar preço/custos para manter margem.',
        })
      }

      if (calculos.roasCalculado > 0 && calculos.roasCalculado < calculos.retornoMinIdeal) {
        items.push({
          level: 'danger',
          title: 'Retorno',
          message: `ROAS (${calculos.roasCalculado.toFixed(2)}x) abaixo do mínimo ideal (${calculos.retornoMinIdeal}x).`,
          recommendation: 'Campanha com risco de prejuízo. Pausar ou otimizar.',
        })
      } else if (calculos.roasCalculado >= calculos.retornoMinIdeal) {
        items.push({
          level: 'success',
          title: 'Retorno',
          message: `ROAS (${calculos.roasCalculado.toFixed(2)}x) dentro do mínimo ideal.`,
        })
      }

      if (calculos.lucroRealCliente < 0) {
        items.push({
          level: 'danger',
          title: 'Margem',
          message: 'Lucro real por cliente negativo — prejuízo operacional.',
          recommendation: 'Aumentar preço, reduzir custos ou CPA.',
        })
      } else if (calculos.lucroRealCliente > 0 && calculos.roasCalculado >= calculos.retornoMinIdeal) {
        items.push({
          level: 'success',
          title: 'Escala',
          message: 'Margem saudável. Escala recomendada (ex.: aumentar orçamento 20%).',
        })
      }
    }

    return items
  }, [alc, imp, cliques, comprasNum, cpa, preco, custoFerr, metaLucro, calculos, taxaCliquesMinSaudavel, frequenciaMaxSaudavel])

  // ---------- DECISÃO CLARA ----------
  const decisao = useMemo(() => {
    const hasDanger = diagnostico.some((d) => d.level === 'danger')
    const hasWarning = diagnostico.some((d) => d.level === 'warning')
    const hasSuccess = diagnostico.some((d) => d.level === 'success')
    if (calculos.lucroRealCliente < 0) return { label: 'Deve pausar', color: 'text-red-600', bg: 'bg-red-50 border-red-200' }
    if (hasDanger) return { label: 'Deve otimizar', color: 'text-red-600', bg: 'bg-red-50 border-red-200' }
    if (hasWarning) return { label: 'Está em risco', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }
    if (hasSuccess && calculos.lucroRealCliente > 0) return { label: 'Deve escalar', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' }
    if (comprasNum > 0 && calculos.roasCalculado >= calculos.retornoMinIdeal) return { label: 'Está saudável', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' }
    return { label: 'Preencha os dados', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' }
  }, [diagnostico, calculos.lucroRealCliente, calculos.roasCalculado, calculos.retornoMinIdeal, comprasNum])

  // ---------- SCORE SAÚDE 0–100 ----------
  const healthScore = useMemo(() => {
    if (alc === 0 && imp === 0 && comprasNum === 0) return null
    let score = 50
    if (calculos.taxaCliquesCalc >= (toNum(taxaCliquesMinSaudavel) || 1)) score += 10
    if (calculos.frequencia > 0 && calculos.frequencia <= (toNum(frequenciaMaxSaudavel) || 3)) score += 10
    if (calculos.roasCalculado >= calculos.retornoMinIdeal) score += 15
    if (calculos.lucroRealCliente > 0) score += 15
    if (cpa <= calculos.custoMaxAceitavelCompra && calculos.custoMaxAceitavelCompra > 0) score += 10
    diagnostico.forEach((d) => {
      if (d.level === 'danger') score -= 15
      else if (d.level === 'warning') score -= 5
    })
    return Math.max(0, Math.min(100, score))
  }, [calculos, diagnostico, cpa, alc, imp, comprasNum, taxaCliquesMinSaudavel, frequenciaMaxSaudavel])

  // ---------- SIMULADOR ----------
  const simOrc = toNum(simOrcamento) || orcamento
  const mult = simMultiplicador === '1.2' ? 1.2 : simMultiplicador === '1.5' ? 1.5 : 2
  const simInvestido = simOrc * mult
  const simCompras = investido > 0 && comprasNum > 0 ? (simInvestido / investido) * comprasNum : 0
  const simReceita = simCompras * preco
  const simLucro = simCompras * calculos.lucroRealCliente
  const lucroLiquidoAtual = comprasNum * calculos.lucroRealCliente - investido
  const pontoEquilibrio = calculos.lucroRealCliente > 0 && comprasNum > 0
    ? investido / (comprasNum * calculos.lucroRealCliente)
    : null

  const alertColor = (level: AlertLevel) => {
    switch (level) {
      case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-800'
      case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800'
      case 'danger': return 'bg-red-50 border-red-200 text-red-800'
      default: return 'bg-sky-50 border-sky-200 text-sky-800'
    }
  }

  const AlertIcon = ({ level }: { level: AlertLevel }) => {
    if (level === 'success') return <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
    if (level === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
    if (level === 'danger') return <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
    return <Target className="w-5 h-5 text-sky-600 flex-shrink-0" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardNavigation
          title="Painel Inteligente de Análise de Campanhas"
          subtitle="Consultor automático para tráfego pago — diagnóstico, métricas e recomendações"
          backUrl="/dashboard"
          backLabel="Voltar ao Dashboard"
        />

        {/* Score e decisão em destaque */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {healthScore != null && (
            <Card className={`border-2 ${decisao.bg}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Saúde da campanha
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold">{healthScore}</span>
                  <span className="text-gray-500">/ 100</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">Indicador geral de saúde com base nos parâmetros configurados.</p>
              </CardContent>
            </Card>
          )}
          <Card className={`border-2 ${decisao.bg}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-lg flex items-center gap-2 ${decisao.color}`}>
                <Zap className="w-5 h-5" />
                Decisão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-xl font-semibold ${decisao.color}`}>{decisao.label}</p>
              <p className="mt-1 text-sm text-gray-600">
                {decisao.label === 'Preencha os dados' && 'Insira os dados do Gerenciador de Anúncios e financeiros para ver o diagnóstico.'}
                {decisao.label !== 'Preencha os dados' && 'Com base nos dados inseridos e nos parâmetros saudáveis.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Inputs */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Dados da campanha e financeiros
            </CardTitle>
            <p className="text-sm text-gray-500">
              Insira manualmente os dados do Gerenciador de Anúncios (Meta/Google) e os dados financeiros internos.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Métricas da campanha</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Input label="Alcance" type="text" inputMode="numeric" value={alcance} onChange={(e) => setAlcance(e.target.value)} placeholder="Ex: 50000" />
                <Input label="Impressões" type="text" inputMode="numeric" value={impressoes} onChange={(e) => setImpressoes(e.target.value)} placeholder="Ex: 120000" />
                <Input label="Frequência (opcional)" type="text" inputMode="decimal" value={frequenciaManual} onChange={(e) => setFrequenciaManual(e.target.value)} placeholder="Impressões ÷ Alcance" />
                <Input label="Cliques no link" type="text" inputMode="numeric" value={cliquesLink} onChange={(e) => setCliquesLink(e.target.value)} placeholder="Ex: 1200" />
                <Input label="Taxa de cliques (%)" type="text" inputMode="decimal" value={taxaCliquesPct} onChange={(e) => setTaxaCliquesPct(e.target.value)} placeholder="Ou calculado" />
                <Input label="Custo por clique (R$)" type="text" inputMode="decimal" value={custoPorClique} onChange={(e) => setCustoPorClique(e.target.value)} placeholder="Ex: 1.50" />
                <Input label="Compras" type="text" inputMode="numeric" value={compras} onChange={(e) => setCompras(e.target.value)} placeholder="Ex: 30" />
                <Input label="Custo por compra (R$)" type="text" inputMode="decimal" value={custoPorCompra} onChange={(e) => setCustoPorCompra(e.target.value)} placeholder="Ex: 45" />
                <Input label="Valor investido (R$)" type="text" inputMode="decimal" value={valorInvestido} onChange={(e) => setValorInvestido(e.target.value)} placeholder="Ex: 1350" />
                <Input label="Valor de conversão (R$)" type="text" inputMode="decimal" value={valorConversaoCompras} onChange={(e) => setValorConversaoCompras(e.target.value)} placeholder="Receita das compras" />
                <Input label="ROAS" type="text" inputMode="decimal" value={roas} onChange={(e) => setRoas(e.target.value)} placeholder="Ou calculado" />
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Dados financeiros internos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input label="Preço do plano (R$)" type="text" inputMode="decimal" value={precoPlano} onChange={(e) => setPrecoPlano(e.target.value)} placeholder="Ex: 97" />
                <Input label="Custo ferramentas/cliente (R$)" type="text" inputMode="decimal" value={custoFerramentasCliente} onChange={(e) => setCustoFerramentasCliente(e.target.value)} placeholder="Ex: 25" />
                <Input label="Meta lucro/cliente (R$)" type="text" inputMode="decimal" value={metaLucroCliente} onChange={(e) => setMetaLucroCliente(e.target.value)} placeholder="Ex: 30" />
                <Input label="Orçamento mensal (R$)" type="text" inputMode="decimal" value={orcamentoMensal} onChange={(e) => setOrcamentoMensal(e.target.value)} placeholder="Ex: 3000" />
                <Input label="Retenção média (meses)" type="text" inputMode="numeric" value={retencaoMeses} onChange={(e) => setRetencaoMeses(e.target.value)} placeholder="LTV - opcional" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parâmetros saudáveis (colapsável) */}
        <Card className="mb-6">
          <button
            type="button"
            onClick={() => setShowParams(!showParams)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span className="font-medium">Parâmetros saudáveis (ajustáveis)</span>
            {showParams ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showParams && (
            <CardContent className="pt-0 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Taxa de cliques mínima (%)" type="text" inputMode="decimal" value={taxaCliquesMinSaudavel} onChange={(e) => setTaxaCliquesMinSaudavel(e.target.value)} />
              <Input label="Frequência máxima" value={frequenciaMaxSaudavel} onChange={(e) => setFrequenciaMaxSaudavel(e.target.value)} />
              <Input label="Retorno mínimo ideal (ROAS)" type="text" inputMode="decimal" value={retornoMinimoIdeal} onChange={(e) => setRetornoMinimoIdeal(e.target.value)} />
            </CardContent>
          )}
        </Card>

        {/* Cálculos automáticos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Cálculos automáticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Frequência</p>
                <p className="font-semibold">{alc > 0 && imp > 0 ? calculos.frequencia.toFixed(2) : (freqManual || '—')}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Taxa cliques (%)</p>
                <p className="font-semibold">{calculos.taxaCliquesCalc > 0 ? calculos.taxaCliquesCalc.toFixed(2) : '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Taxa conversão (%)</p>
                <p className="font-semibold">{calculos.taxaConversao > 0 ? calculos.taxaConversao.toFixed(2) : '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Receita total (R$)</p>
                <p className="font-semibold">{calculos.receitaTotal > 0 ? calculos.receitaTotal.toFixed(2) : '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Lucro bruto/cliente (R$)</p>
                <p className="font-semibold">{calculos.lucroBrutoCliente > 0 ? calculos.lucroBrutoCliente.toFixed(2) : '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Lucro real/cliente (R$)</p>
                <p className={`font-semibold ${calculos.lucroRealCliente < 0 ? 'text-red-600' : ''}`}>
                  {preco > 0 ? calculos.lucroRealCliente.toFixed(2) : '—'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Custo máx. compra (R$)</p>
                <p className="font-semibold">{calculos.custoMaxAceitavelCompra > 0 ? calculos.custoMaxAceitavelCompra.toFixed(2) : '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">ROAS</p>
                <p className="font-semibold">{calculos.roasCalculado > 0 ? calculos.roasCalculado.toFixed(2) + 'x' : '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Margem real (%)</p>
                <p className="font-semibold">{calculos.margemRealPct > 0 ? calculos.margemRealPct.toFixed(1) + '%' : '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Proj. lucro mensal (R$)</p>
                <p className="font-semibold">{calculos.projLucroMensal !== 0 ? calculos.projLucroMensal.toFixed(2) : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diagnóstico e alertas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Diagnóstico automático</CardTitle>
            <p className="text-sm text-gray-500">Recomendações com base em criativo, conversão e finanças.</p>
          </CardHeader>
          <CardContent>
            {diagnostico.length === 0 ? (
              <p className="text-gray-500 text-sm">Preencha alcance/impressões e compras para ver o diagnóstico.</p>
            ) : (
              <div className="space-y-3">
                {diagnostico.map((d, i) => (
                  <div key={i} className={`flex gap-3 p-3 rounded-lg border ${alertColor(d.level)}`}>
                    <AlertIcon level={d.level} />
                    <div>
                      <p className="font-medium">{d.title}</p>
                      <p className="text-sm opacity-90">{d.message}</p>
                      {d.recommendation && <p className="text-sm mt-1 font-medium">→ {d.recommendation}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simulador estratégico */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Simulador estratégico
            </CardTitle>
            <p className="text-sm text-gray-500">Simule aumento de orçamento e veja projeção de vendas e lucro.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[180px]">
                <Input
                  label="Orçamento base (R$)"
                  type="text"
                  inputMode="decimal"
                  value={simOrcamento || (orcamento > 0 ? String(orcamento) : '')}
                  onChange={(e) => setSimOrcamento(e.target.value)}
                  placeholder={orcamento > 0 ? String(orcamento) : 'Ex: 3000'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Multiplicador</label>
                <select
                  value={simMultiplicador}
                  onChange={(e) => setSimMultiplicador(e.target.value as '1.2' | '1.5' | '2')}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black"
                >
                  <option value="1.2">+20%</option>
                  <option value="1.5">+50%</option>
                  <option value="2">+100%</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Investimento simulado (R$)</p>
                <p className="font-semibold">{simInvestido.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Projeção compras</p>
                <p className="font-semibold">{simCompras.toFixed(0)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Projeção receita (R$)</p>
                <p className="font-semibold">{simReceita.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Projeção lucro (R$)</p>
                <p className={`font-semibold ${simLucro < 0 ? 'text-red-600' : ''}`}>{simLucro.toFixed(2)}</p>
              </div>
            </div>
            {pontoEquilibrio != null && pontoEquilibrio > 0 && (
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Razão investido / lucro gerado:</strong> {pontoEquilibrio.toFixed(2)} — {pontoEquilibrio > 1 ? 'acima de 1 = campanha em prejuízo' : 'abaixo de 1 = margem positiva'}.</p>
                {lucroLiquidoAtual !== 0 && (
                  <p><strong>Lucro líquido atual (receita - custos - investido):</strong> R$ {lucroLiquidoAtual.toFixed(2)}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Módulo LTV */}
        <Card className="mb-6">
          <button
            type="button"
            onClick={() => setShowLtv(!showLtv)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
          >
            <CardTitle className="!mb-0 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Módulo LTV (recorrência)
            </CardTitle>
            {showLtv ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showLtv && (
            <CardContent className="pt-0">
              <p className="text-sm text-gray-500 mb-4">
                Com o tempo médio de retenção (meses), o sistema recalcula o custo máximo aceitável por compra e o retorno mínimo saudável considerando o valor total do ciclo.
              </p>
              {ltv ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500">Valor total no ciclo (R$)</p>
                    <p className="font-semibold">{ltv.valorTotalCiclo.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500">Custo máx. por compra (LTV)</p>
                    <p className="font-semibold">{ltv.custoMaxPorCompraLtv.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500">Retorno mínimo saudável (LTV)</p>
                    <p className="font-semibold">{ltv.retornoMinSaudavelLtv.toFixed(2)}x</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Preencha preço do plano e retenção média (meses) para ver os cálculos de LTV.</p>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
