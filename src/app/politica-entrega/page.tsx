import { TermsContent } from '@/components/ui/TermsContent'

const DEFAULT_CONTENT = `# Política de Entrega

## 1. Prazos de Entrega

Os prazos de entrega são calculados a partir da confirmação do pagamento e podem variar de acordo com a localidade:

- **Uberlândia/MG**: Até 24 horas
- **Outras cidades**: 3 a 10 dias úteis

## 2. Custos de Entrega

Os custos de entrega são calculados no momento da finalização da compra e variam de acordo com:

- Local de entrega
- Peso e dimensões do produto
- Forma de envio escolhida

## 3. Formas de Entrega

Oferecemos as seguintes formas de entrega:

- Entrega expressa (disponível para Uberlândia)
- Entrega padrão (correios)
- Retirada na loja (gratuita)

## 4. Rastreamento

Após a postagem, você receberá um código de rastreamento por e-mail para acompanhar seu pedido.`

export default function PoliticaEntrega() {
  return (
    <TermsContent
      termKey="politica-entrega"
      defaultTitle="Política de Entrega"
      defaultContent={DEFAULT_CONTENT}
    />
  )
}
