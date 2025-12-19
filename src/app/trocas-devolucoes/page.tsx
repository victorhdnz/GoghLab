import { TermsContent } from '@/components/ui/TermsContent'

const DEFAULT_CONTENT = `# Trocas e Devoluções

## 1. Prazo para Troca/Devolução

Você tem até **7 dias corridos** a partir da data de recebimento do produto para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor.

## 2. Condições para Troca/Devolução

O produto deve estar:

- Nas condições originais de venda
- Com todas as etiquetas e embalagens originais
- Sem sinais de uso ou danos
- Acompanhado da nota fiscal

## 3. Processo de Troca/Devolução

Para solicitar troca ou devolução:

1. Entre em contato conosco através do WhatsApp ou e-mail
2. Informe o motivo da troca/devolução
3. Aguarde nossa resposta com as instruções
4. Envie o produto conforme as instruções recebidas

## 4. Reembolso

Em caso de devolução, o reembolso será processado no mesmo método de pagamento utilizado na compra, em até 10 dias úteis após o recebimento do produto em nossa loja.`

export default function TrocasDevolucoes() {
  return (
    <TermsContent
      termKey="trocas-devolucoes"
      defaultTitle="Trocas e Devoluções"
      defaultContent={DEFAULT_CONTENT}
    />
  )
}
