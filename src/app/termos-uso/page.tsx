import { TermsContent } from '@/components/ui/TermsContent'

const DEFAULT_CONTENT = `# Termos de Uso

## 1. Aceitação dos Termos

Ao acessar e utilizar este site, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Se você não concorda com alguma parte destes termos, não deve utilizar nosso site.

## 2. Uso do Site

Você concorda em usar este site apenas para fins legais e de acordo com estes termos:

- Não utilizar o site de forma fraudulenta ou enganosa
- Não realizar atividades que possam danificar, desabilitar ou sobrecarregar o site
- Não tentar obter acesso não autorizado a áreas restritas do site
- Não usar o site para transmitir qualquer material malicioso ou prejudicial

## 3. Conta do Usuário

Ao criar uma conta, você é responsável por manter a segurança de sua senha e por todas as atividades que ocorram sob sua conta. Você concorda em:

- Fornecer informações precisas e atualizadas
- Manter a confidencialidade de sua senha
- Notificar-nos imediatamente sobre qualquer uso não autorizado
- Ser responsável por todas as atividades em sua conta

## 4. Produtos e Preços

Nos esforçamos para fornecer informações precisas sobre produtos e preços. No entanto:

- Reservamos o direito de corrigir erros de preços a qualquer momento
- Os preços estão sujeitos a alterações sem aviso prévio
- As imagens dos produtos são apenas ilustrativas
- Podemos limitar as quantidades de produtos por pessoa ou por pedido

## 5. Pagamentos

Aceitamos diversos métodos de pagamento. Ao fazer um pedido, você concorda em:

- Fornecer informações de pagamento precisas e atualizadas
- Autorizar o uso de seu método de pagamento selecionado
- Reconhecer que os pagamentos são processados por processadores terceirizados seguros

## 6. Propriedade Intelectual

Todo o conteúdo deste site, incluindo textos, gráficos, logotipos, ícones, imagens, clipes de áudio e software, é propriedade da Smart Time Prime ou de seus fornecedores de conteúdo e está protegido por leis de direitos autorais e outras leis de propriedade intelectual.

## 7. Limitação de Responsabilidade

Em nenhuma circunstância a Smart Time Prime será responsável por danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo perda de lucros, dados, uso ou outras perdas intangíveis, resultantes do uso ou incapacidade de usar o site.

## 8. Alterações nos Termos

Reservamos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após sua publicação no site. É sua responsabilidade revisar periodicamente estes termos.

## 9. Lei Aplicável

Estes termos são regidos e interpretados de acordo com as leis do Brasil. Qualquer disputa relacionada a estes termos será resolvida nos tribunais competentes.

## 10. Contato

Se você tiver dúvidas sobre estes termos de uso, entre em contato conosco:

**Email:** contato@smarttimeprime.com.br

**Telefone:** (34) 98413-6291`

export default function TermosUso() {
  return (
    <TermsContent
      termKey="termos-uso"
      defaultTitle="Termos de Uso"
      defaultContent={DEFAULT_CONTENT}
    />
  )
}

