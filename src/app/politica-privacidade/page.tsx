import { TermsContent } from '@/components/ui/TermsContent'

const DEFAULT_CONTENT = `# Política de Privacidade

## 1. Informações que Coletamos

Coletamos informações que você nos fornece diretamente, como quando cria uma conta, faz uma compra, entra em contato conosco ou se inscreve em nossa newsletter.

- Nome completo
- Endereço de e-mail
- Número de telefone
- Endereço de entrega e faturamento
- Informações de pagamento (processadas de forma segura)

## 2. Como Utilizamos Suas Informações

Utilizamos suas informações para:

- Processar e enviar seus pedidos
- Comunicar-nos com você sobre pedidos, produtos e promoções
- Melhorar nossos serviços e experiência do cliente
- Detectar e prevenir fraudes
- Cumprir obrigações legais

## 3. Compartilhamento de Informações

Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto conforme descrito nesta política. Podemos compartilhar informações com:

- Provedores de serviços que nos ajudam a operar nosso site e processar pedidos
- Autoridades legais quando exigido por lei
- Empresas afiliadas com o mesmo controle acionário

## 4. Segurança dos Dados

Implementamos medidas de segurança técnicas e organizacionais adequadas para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.

## 5. Seus Direitos

Você tem o direito de:

- Acessar suas informações pessoais
- Corrigir informações imprecisas
- Solicitar a exclusão de suas informações
- Opor-se ao processamento de suas informações
- Solicitar a portabilidade de seus dados

## 6. Cookies

Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o tráfego do site e personalizar conteúdo. Você pode gerenciar suas preferências de cookies nas configurações do seu navegador.

## 7. Alterações nesta Política

Podemos atualizar esta política de privacidade periodicamente. Notificaremos você sobre mudanças significativas publicando a nova política nesta página e atualizando a data de "Última atualização".

## 8. Contato

Se você tiver dúvidas sobre esta política de privacidade, entre em contato conosco:

**Email:** contato.goghlab@gmail.com

**Telefone:** (34) 98413-6291`

export default function PoliticaPrivacidade() {
  return (
    <TermsContent
      termKey="politica-privacidade"
      defaultTitle="Política de Privacidade"
      defaultContent={DEFAULT_CONTENT}
    />
  )
}

