import { TermsContent } from '@/components/ui/TermsContent'

const DEFAULT_CONTENT = `# Termos de Uso

## 1. Aceitação

Ao acessar e utilizar o site e os serviços do Gogh Lab, você concorda com estes Termos de Uso e com nossa Política de Privacidade. O Gogh Lab é uma plataforma digital de ferramentas e recursos com inteligência artificial para criadores de conteúdo. Se você não concordar com alguma parte destes termos, não deve utilizar a plataforma.

## 2. Descrição dos Serviços

O Gogh Lab oferece homepage de apresentação da plataforma, página dedicada de planos e preços (/precos), área de membros com agentes e recursos de IA, ferramentas profissionais integradas ao plano, cursos e criação com IA. O uso efetivo dos recursos que exijam assinatura está condicionado à contratação de um plano e aos Termos de Assinatura e Planos.

## 3. Uso Adequado

Você concorda em utilizar a plataforma apenas para fins legais e em não utilizá-la de forma fraudulenta, para danificar sistemas ou a experiência de outros usuários, obter acesso não autorizado ou violar direitos de terceiros ou de propriedade intelectual.

## 4. Conta e Responsabilidade

Você é responsável por manter a confidencialidade do acesso à sua conta e por todas as atividades realizadas nela, e deve fornecer informações verdadeiras e atualizadas.

## 5. Planos e Preços

Os planos, preços e condições estão na página de planos (/precos) e nos Termos de Assinatura e Planos. Alterações para novos ciclos serão comunicadas conforme a legislação aplicável.

## 6. Propriedade Intelectual

O conteúdo da plataforma é de propriedade do Gogh Lab ou de seus licenciadores. O conteúdo que você gerar por meio dos recursos da plataforma é de sua responsabilidade.

## 7. Limitação de Responsabilidade

A plataforma é fornecida "como está". Na medida permitida pela lei, o Gogh Lab não se responsabiliza por danos indiretos, consequenciais ou perda de dados ou lucros. Em nenhuma hipótese a responsabilidade total excederá o valor pago por você nos últimos 12 meses.

## 8. Alterações

Reservamo-nos o direito de modificar estes termos. Alterações relevantes serão comunicadas por e-mail ou aviso na plataforma. O uso continuado constitui aceitação dos novos termos.

## 9. Lei Aplicável e Foro

Estes termos são regidos pelas leis do Brasil. Qualquer disputa será submetida ao foro da comarca de Uberlândia/MG.

## 10. Contato

**E-mail:** contato.goghlab@gmail.com  
**WhatsApp:** (34) 98413-6291`

export default function TermosUso() {
  return (
    <TermsContent
      termKey="termos-uso"
      defaultTitle="Termos de Uso"
      defaultContent={DEFAULT_CONTENT}
    />
  )
}

