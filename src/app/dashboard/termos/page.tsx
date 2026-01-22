'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { createClient } from '@/lib/supabase/client'
import { Save, FileText, Shield, Truck, RotateCcw, Plus, Trash2, Edit, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { slugify } from '@/lib/utils/format'

interface Term {
  id: string
  key: string
  title: string
  content: string
  icon: string
  updated_at?: string
}

interface TermSection {
  id: string
  title: string
  content: string
  level: number // 1, 2 ou 3 (para #, ##, ###)
}

const TERMS_CONFIG = [
  {
    key: 'politica-privacidade',
    title: 'Política de Privacidade',
    icon: 'shield',
    defaultContent: `# Política de Privacidade

## 1. Aceitação dos Termos

Ao acessar e utilizar este site, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Se você não concorda com alguma parte destes termos, não deve utilizar nosso site.

## 2. Uso do Site

Você concorda em usar este site apenas para fins legais e de acordo com estes termos:

- Não utilizar o site de forma fraudulenta ou enganosa
- Não realizar atividades que possam danificar, desabilitar ou sobrecarregar o site
- Não tentar obter acesso não autorizado a áreas restritas do site
- Não usar o site para transmitir qualquer material malicioso ou prejudicial

## 3. Informações Coletadas

Coletamos informações que você nos fornece diretamente, como:

- Nome e informações de contato
- Informações de endereço
- Informações de pagamento
- Outras informações que você escolhe fornecer

## 4. Uso das Informações

Utilizamos as informações coletadas para:

- Processar e entregar seus pedidos
- Comunicar-nos com você sobre seu pedido
- Enviar atualizações sobre nossos produtos e serviços
- Melhorar nossos serviços e experiência do usuário

## 5. Proteção dos Dados

Implementamos medidas de segurança adequadas para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.`,
  },
  {
    key: 'termos-uso',
    title: 'Termos de Uso',
    icon: 'file-text',
    defaultContent: `# Termos de Uso

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

Nos esforços para fornecer informações precisas sobre produtos e preços. No entanto:

- Os preços estão sujeitos a alterações sem aviso prévio
- Reservamo-nos o direito de corrigir erros de preços
- As imagens dos produtos são apenas ilustrativas`,
  },
  {
    key: 'politica-entrega',
    title: 'Política de Entrega',
    icon: 'truck',
    defaultContent: `# Política de Entrega

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

Após a postagem, você receberá um código de rastreamento por e-mail para acompanhar seu pedido.`,
  },
  {
    key: 'trocas-devolucoes',
    title: 'Trocas e Devoluções',
    icon: 'rotate-ccw',
    defaultContent: `# Trocas e Devoluções

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

Em caso de devolução, o reembolso será processado no mesmo método de pagamento utilizado na compra, em até 10 dias úteis após o recebimento do produto em nossa loja.`,
  },
  {
    key: 'termos-login-google',
    title: 'Termos de Autenticação com Google',
    icon: 'shield',
    defaultContent: `# Termos de Autenticação com Google

## 1. Aceitação dos Termos

Ao utilizar a autenticação via Google para acessar a plataforma Gogh Lab, você concorda expressamente com os termos e condições estabelecidos neste documento. A utilização deste serviço implica na aceitação integral e irrestrita de todas as cláusulas aqui dispostas.

## 2. Autenticação via Google

### 2.1. Processo de Autenticação

A autenticação é realizada através da plataforma Google OAuth, utilizando suas credenciais da conta Google. Ao clicar em "Continuar com Google", você será redirecionado para a página de autenticação do Google, onde deverá autorizar o acesso da Gogh Lab aos dados básicos da sua conta.

### 2.2. Dados Coletados

Ao autenticar-se via Google, coletamos apenas as seguintes informações básicas da sua conta Google:

- **Nome completo**: Para identificação e personalização da experiência
- **Endereço de e-mail**: Para comunicação e identificação da conta
- **Foto de perfil**: Para exibição no perfil da plataforma (opcional)

### 2.3. Uso dos Dados

Os dados coletados são utilizados exclusivamente para:

- Criação e gerenciamento da sua conta na plataforma Gogh Lab
- Personalização da experiência do usuário
- Comunicação sobre serviços, atualizações e informações relevantes
- Cumprimento de obrigações legais e regulatórias

## 3. Responsabilidades do Usuário

### 3.1. Segurança da Conta

Você é o único responsável por:

- Manter a segurança e confidencialidade das credenciais da sua conta Google
- Notificar imediatamente a Gogh Lab sobre qualquer uso não autorizado da sua conta
- Garantir que possui autorização para utilizar a conta Google informada
- Todas as atividades realizadas através da sua conta autenticada

### 3.2. Uso Adequado

Você concorda em:

- Utilizar a plataforma apenas para fins legais e lícitos
- Não compartilhar suas credenciais de acesso com terceiros
- Não realizar atividades que possam comprometer a segurança da plataforma
- Respeitar os direitos de propriedade intelectual da Gogh Lab e de terceiros

## 4. Privacidade e Proteção de Dados

### 4.1. Conformidade Legal

A Gogh Lab está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e demais legislações aplicáveis. O tratamento dos seus dados pessoais segue rigorosamente os princípios estabelecidos na legislação vigente.

### 4.2. Compartilhamento de Dados

A Gogh Lab **não compartilha, vende ou aluga** seus dados pessoais para terceiros, exceto:

- Quando necessário para o cumprimento de obrigações legais
- Com seu consentimento expresso
- Para prestação de serviços essenciais (processamento de pagamentos, hospedagem, etc.), sempre com garantias de proteção adequadas

### 4.3. Retenção de Dados

Seus dados serão mantidos enquanto sua conta estiver ativa ou enquanto necessário para cumprimento de obrigações legais. Você pode solicitar a exclusão dos seus dados a qualquer momento, conforme previsto na LGPD.

## 5. Limitações de Responsabilidade

### 5.1. Serviços de Terceiros

A Gogh Lab utiliza os serviços de autenticação do Google, que são fornecidos e gerenciados exclusivamente pela Google LLC. A Gogh Lab **não se responsabiliza** por:

- Falhas, interrupções ou indisponibilidades dos serviços de autenticação do Google
- Problemas de segurança que ocorram na infraestrutura do Google
- Alterações nas políticas ou termos de serviço do Google que possam afetar a autenticação

### 5.2. Disponibilidade do Serviço

Embora nos esforcemos para manter a plataforma sempre disponível, não garantimos que o serviço estará livre de interrupções, erros ou falhas técnicas. A Gogh Lab não se responsabiliza por perdas ou danos decorrentes de indisponibilidade temporária do serviço.

## 6. Modificações nos Termos

A Gogh Lab reserva-se o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após sua publicação na plataforma. É sua responsabilidade revisar periodicamente estes termos. O uso continuado da plataforma após as modificações constitui aceitação dos novos termos.

## 7. Rescisão

A Gogh Lab reserva-se o direito de suspender ou encerrar sua conta, a qualquer momento e sem aviso prévio, em caso de:

- Violação destes termos ou de qualquer política da plataforma
- Uso fraudulento ou inadequado da conta
- Solicitação de autoridades competentes
- Qualquer outra situação que comprometa a segurança ou integridade da plataforma

## 8. Lei Aplicável e Foro

Estes termos são regidos pela legislação brasileira. Qualquer controvérsia decorrente destes termos será resolvida no foro da comarca de Uberlândia/MG, renunciando as partes a qualquer outro, por mais privilegiado que seja.

## 9. Contato

Para questões relacionadas a estes termos ou à proteção de dados, entre em contato através de:

- **E-mail**: contato.goghlab@gmail.com
- **WhatsApp**: [número configurado na plataforma]

**Última atualização**: Janeiro de 2026`,
  },
  {
    key: 'termos-assinatura-planos',
    title: 'Termos de Assinatura e Planos',
    icon: 'file-text',
    defaultContent: `# Termos de Assinatura e Planos

## 1. Aceitação dos Termos

Ao assinar qualquer plano de assinatura da plataforma Gogh Lab, você concorda expressamente com os termos e condições estabelecidos neste documento. A contratação de qualquer plano implica na aceitação integral e irrestrita de todas as cláusulas aqui dispostas, bem como dos limites de uso e condições específicas de cada plano.

## 2. Planos de Assinatura

### 2.1. Planos Disponíveis

A Gogh Lab oferece os seguintes planos de assinatura:

#### 2.1.1. Plano Gratuito
- **Custo**: Gratuito
- **Recursos**: Acesso limitado a recursos básicos da plataforma
- **Limites de Uso**: Conforme especificado na descrição do plano
- **Renovação**: Não aplicável (plano permanente)

#### 2.1.2. Plano Gogh Essencial
- **Custo**: Conforme valores divulgados na plataforma
- **Ciclo de Cobrança**: Mensal ou Anual (conforme selecionado)
- **Recursos**: Acesso completo aos recursos do plano Essencial
- **Limites de Uso**: Conforme especificado na descrição detalhada do plano
- **Renovação**: Automática, conforme ciclo contratado

#### 2.1.3. Plano Gogh Pro
- **Custo**: Conforme valores divulgados na plataforma
- **Ciclo de Cobrança**: Mensal ou Anual (conforme selecionado)
- **Recursos**: Acesso completo a todos os recursos da plataforma, incluindo recursos exclusivos do plano Pro
- **Limites de Uso**: Conforme especificado na descrição detalhada do plano
- **Renovação**: Automática, conforme ciclo contratado

### 2.2. Descrição Detalhada dos Recursos

A descrição completa dos recursos, limites de uso mensais, e benefícios de cada plano está disponível na página de planos da plataforma. É sua responsabilidade revisar cuidadosamente as especificações de cada plano antes da contratação.

### 2.3. Limites de Uso

Cada plano possui limites específicos de uso mensal para determinados recursos, incluindo, mas não se limitando a:

- **Mensagens de IA**: Número máximo de mensagens/interações com agentes de IA por mês
- **Acesso a Cursos**: Quantidade e tipo de cursos disponíveis
- **Acesso a Ferramentas Pro**: Disponibilidade e limites de uso de ferramentas profissionais (Canva Pro, CapCut Pro, etc.)
- **Suporte**: Nível e prioridade de suporte disponível

Os limites são resetados a cada início de período de cobrança (mensal ou anual, conforme o plano). O não uso dos limites em um período não gera créditos ou acúmulo para períodos futuros.

### 2.4. Acesso às Ferramentas Pro (Canva Pro e CapCut Pro)

#### 2.4.1. Período de Liberação

Conforme o Código de Defesa do Consumidor (CDC), você tem 7 (sete) dias corridos a partir da data de contratação para exercer seu direito de arrependimento e solicitar reembolso total.

Para garantir que o período de arrependimento seja respeitado e evitar que credenciais de acesso sejam fornecidas antes do término deste prazo, o **acesso às ferramentas profissionais Canva Pro e CapCut Pro será liberado apenas a partir do oitavo dia** após a data de início da sua assinatura.

**IMPORTANTE:** Esta regra se aplica tanto para **compras iniciais** (primeira contratação de um plano) quanto para **renovações** (renovação automática ou manual da assinatura). Em ambos os casos, o período de espera de 8 dias é contado a partir da data de início do novo período de assinatura (current_period_start), garantindo que o direito de arrependimento seja respeitado em cada ciclo contratual.

**ISENÇÃO DE RESPONSABILIDADE:** Ao contratar qualquer plano de assinatura, você reconhece e aceita expressamente que o acesso às ferramentas profissionais (Canva Pro e CapCut Pro) estará disponível apenas a partir do oitavo dia após o início da sua assinatura (ou renovação), e que este período de espera é uma condição essencial do contrato, estabelecida para garantir o cumprimento do período de arrependimento previsto no CDC. Você concorda que não terá direito a qualquer tipo de compensação, reembolso parcial, desconto ou indenização em decorrência deste período de espera, e que esta condição não constitui falha na prestação do serviço ou descumprimento contratual por parte da Gogh Lab.

#### 2.4.2. Processo de Solicitação

- Após o oitavo dia da assinatura (seja compra inicial ou renovação), você poderá solicitar acesso às ferramentas através da área de membros
- A solicitação será processada e o acesso será liberado em até 24 horas após a aprovação
- Você receberá as credenciais de acesso (link de ativação do Canva Pro e login/senha do CapCut Pro) através da plataforma

#### 2.4.3. Período de Uso

Após a liberação do acesso, você terá **30 (trinta) dias de uso** das ferramentas Canva Pro e CapCut Pro, contados a partir da data de liberação das credenciais. Este período é independente do ciclo de cobrança da sua assinatura e visa garantir que você tenha tempo suficiente para aproveitar os recursos das ferramentas.

#### 2.4.4. Renovação do Acesso

O acesso às ferramentas pode ser renovado mediante nova solicitação, desde que sua assinatura esteja ativa e em dia. **A renovação seguirá o mesmo processo descrito acima, incluindo o período de espera de 8 dias a partir da data de início do novo período de assinatura.** Ou seja, mesmo que você já tenha tido acesso às ferramentas em um período anterior, ao renovar sua assinatura, será necessário aguardar novamente o oitavo dia do novo período para solicitar um novo acesso.

#### 2.4.5. Responsabilidade pelo Uso

Você é responsável pelo uso adequado das credenciais fornecidas e deve manter a confidencialidade das mesmas. O compartilhamento não autorizado das credenciais pode resultar no cancelamento imediato do acesso, sem direito a reembolso.

## 3. Contratação e Pagamento

### 3.1. Processo de Contratação

A contratação do plano é realizada através da plataforma de pagamento Stripe. Ao selecionar um plano e prosseguir com o pagamento, você está formalizando a contratação do serviço.

### 3.2. Preços e Formas de Pagamento

- **Preços**: Os preços dos planos são divulgados na plataforma e podem ser alterados a qualquer momento, sem aviso prévio. Alterações de preço não afetam planos já contratados durante o período de vigência.
- **Formas de Pagamento**: Aceitamos cartões de crédito e débito através da plataforma Stripe.
- **Desconto Anual**: Planos anuais podem oferecer desconto em relação ao plano mensal, conforme divulgado na plataforma.

### 3.3. Confirmação do Pagamento

A ativação do plano ocorre imediatamente após a confirmação do pagamento pela instituição financeira. Em caso de falha no pagamento, o plano não será ativado e você será notificado.

### 3.4. Renovação Automática

Os planos pagos são renovados automaticamente no final de cada período (mensal ou anual), mediante cobrança no método de pagamento cadastrado. Você será notificado com antecedência sobre a próxima cobrança.

## 4. Cancelamento e Reembolso

### 4.1. Cancelamento pelo Usuário

Você pode cancelar sua assinatura a qualquer momento através da área de membros da plataforma ou através do portal de gerenciamento do Stripe. O cancelamento será efetivado ao final do período já pago, e você continuará tendo acesso aos recursos até o término do período.

### 4.2. Cancelamento pela Gogh Lab

A Gogh Lab reserva-se o direito de cancelar sua assinatura, sem reembolso, em caso de:

- Violação dos termos de uso ou políticas da plataforma
- Uso fraudulento ou inadequado dos serviços
- Não pagamento ou recusa de cobrança recorrente
- Qualquer situação que comprometa a segurança ou integridade da plataforma

### 4.3. Política de Reembolso

#### 4.3.1. Reembolso Total
- **Período de Arrependimento**: 7 (sete) dias corridos a partir da data de contratação, conforme previsto no Código de Defesa do Consumidor (CDC - Art. 49)
- **Direito de Arrependimento**: Conforme o CDC, você tem direito ao reembolso total se solicitar o cancelamento dentro do período de arrependimento de 7 dias, independentemente do uso ou não dos recursos do plano durante este período. O direito de arrependimento é irrestrito e não requer justificativa.
- **Processamento**: O reembolso total será processado quando solicitado dentro do período de arrependimento, respeitando o direito garantido pelo CDC

#### 4.3.2. Reembolso Proporcional
- Após o período de arrependimento, **não há direito a reembolso**, exceto em casos específicos previstos em lei ou por decisão da Gogh Lab, a seu exclusivo critério

#### 4.3.3. Processamento do Reembolso
- O reembolso será processado no mesmo método de pagamento utilizado na contratação
- O prazo para crédito na conta pode variar de 5 a 10 dias úteis, dependendo da instituição financeira

## 5. Alterações nos Planos

### 5.1. Alteração de Plano pelo Usuário

Você pode fazer upgrade (mudança para plano superior) ou downgrade (mudança para plano inferior) a qualquer momento através da área de membros. As alterações terão efeito imediato, com ajuste proporcional na cobrança.

### 5.2. Alterações pela Gogh Lab

A Gogh Lab reserva-se o direito de:

- Modificar recursos, limites de uso ou preços dos planos a qualquer momento
- Adicionar ou remover recursos de qualquer plano
- Descontinuar planos específicos (com aviso prévio de 30 dias)

Alterações que reduzam significativamente os recursos do seu plano atual serão comunicadas com antecedência mínima de 30 dias, e você terá direito a cancelar sem penalidades.

## 6. Disponibilidade e Uptime

### 6.1. Disponibilidade do Serviço

A Gogh Lab se esforça para manter a plataforma disponível 24 horas por dia, 7 dias por semana. No entanto, não garantimos disponibilidade ininterrupta e não nos responsabilizamos por:

- Manutenções programadas ou de emergência
- Falhas técnicas ou de infraestrutura
- Problemas de conectividade de internet do usuário
- Indisponibilidade de serviços de terceiros (Stripe, Google, etc.)

## 7. Limites de Uso e Fair Use

### 7.1. Uso Razoável

Os recursos da plataforma devem ser utilizados de forma razoável e dentro dos limites estabelecidos para cada plano. A Gogh Lab reserva-se o direito de:

- Limitar ou suspender o acesso em caso de uso excessivo ou abusivo
- Monitorar o uso dos recursos para garantir conformidade com os limites do plano
- Solicitar explicações sobre padrões de uso incomuns

### 7.2. Uso Proibido

É expressamente proibido:

- Compartilhar credenciais de acesso com terceiros
- Utilizar a plataforma para atividades ilegais ou não autorizadas
- Tentar burlar limites de uso através de métodos técnicos ou não autorizados
- Realizar atividades que possam comprometer a segurança ou performance da plataforma

## 8. Propriedade Intelectual

### 8.1. Conteúdo da Plataforma

Todo o conteúdo da plataforma, incluindo textos, imagens, vídeos, cursos, agentes de IA, e demais materiais, é de propriedade exclusiva da Gogh Lab ou de seus licenciadores, protegido por leis de propriedade intelectual.

### 8.2. Conteúdo Gerado pelo Usuário

Conteúdo gerado através dos recursos da plataforma (textos, imagens, etc.) é de propriedade do usuário, desde que não viole direitos de terceiros. A Gogh Lab não reivindica propriedade sobre conteúdo gerado pelo usuário.

### 8.3. Uso de Conteúdo

O uso dos recursos da plataforma é pessoal e não transferível. É proibido:

- Reproduzir, distribuir ou comercializar conteúdo da plataforma sem autorização
- Utilizar conteúdo da plataforma para treinar modelos de IA concorrentes
- Realizar engenharia reversa ou descompilação de qualquer parte da plataforma

## 9. Limitação de Responsabilidade

### 9.1. Isenção de Garantias

A plataforma é fornecida "como está", sem garantias expressas ou implícitas de qualquer natureza. A Gogh Lab não garante que:

- A plataforma atenderá todas as suas necessidades
- Os resultados obtidos serão exatos ou adequados aos seus objetivos
- A plataforma estará livre de erros, vírus ou outros componentes prejudiciais

### 9.2. Limitação de Danos

A Gogh Lab não se responsabiliza por:

- Perdas diretas, indiretas, incidentais ou consequenciais decorrentes do uso ou impossibilidade de uso da plataforma
- Perda de dados, receitas, oportunidades de negócio ou lucros cessantes
- Danos resultantes de falhas técnicas, interrupções ou indisponibilidade do serviço

### 9.3. Limite Máximo de Responsabilidade

Em nenhuma hipótese a responsabilidade total da Gogh Lab excederá o valor pago pelo usuário nos últimos 12 (doze) meses pela assinatura.

## 10. Proteção de Dados

### 10.1. Tratamento de Dados

O tratamento dos seus dados pessoais segue rigorosamente a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). Para mais informações, consulte nossa Política de Privacidade.

### 10.2. Dados de Pagamento

Dados de pagamento são processados exclusivamente pela Stripe, em conformidade com os mais altos padrões de segurança (PCI DSS). A Gogh Lab não armazena informações completas de cartão de crédito.

## 11. Modificações nos Termos

A Gogh Lab reserva-se o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas com antecedência mínima de 30 dias. O uso continuado da plataforma após as modificações constitui aceitação dos novos termos.

## 12. Resolução de Conflitos

### 12.1. Tentativa de Resolução Amigável

Em caso de conflitos, as partes se comprometem a tentar resolver a questão de forma amigável através de comunicação direta.

### 12.2. Mediação

Caso não seja possível resolver amigavelmente, as partes podem optar por mediação antes de recorrer ao Poder Judiciário.

## 13. Lei Aplicável e Foro

Estes termos são regidos pela legislação brasileira. Qualquer controvérsia decorrente destes termos será resolvida no foro da comarca de Uberlândia/MG, renunciando as partes a qualquer outro, por mais privilegiado que seja.

## 14. Disposições Gerais

### 14.1. Integralidade

Estes termos, juntamente com a Política de Privacidade e demais políticas da plataforma, constituem o acordo integral entre você e a Gogh Lab.

### 14.2. Tolerância

A tolerância de qualquer violação destes termos não constitui renúncia de direitos pela Gogh Lab.

### 14.3. Divisibilidade

Se qualquer disposição destes termos for considerada inválida ou inexequível, as demais disposições permanecerão em pleno vigor.

## 15. Contato

Para questões relacionadas a assinaturas, pagamentos ou estes termos, entre em contato através de:

- **E-mail**: contato.goghlab@gmail.com
- **WhatsApp**: [número configurado na plataforma]
- **Portal de Gerenciamento**: Acesse sua área de membros para gerenciar sua assinatura

**Última atualização**: Janeiro de 2026`,
  },
]

export default function DashboardTermsPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [terms, setTerms] = useState<Term[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)
  const [sections, setSections] = useState<TermSection[]>([])
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showNewTermModal, setShowNewTermModal] = useState(false)
  const [newTerm, setNewTerm] = useState({ title: '', icon: 'file-text' })
  const [newTermSections, setNewTermSections] = useState<TermSection[]>([
    {
      id: `section-${Date.now()}-0`,
      title: 'Primeira Seção',
      content: '',
      level: 2
    }
  ])

  useEffect(() => {
    // Carregar termos - autenticação é verificada pelo middleware
    loadTerms().then(() => {
      // Deletar termos antigos que não são mais necessários após carregar
      deleteOldTerms()
    })
  }, [])

  const deleteOldTerms = async () => {
    try {
      // Termos antigos que devem ser removidos
      const oldTermKeys = ['politica-entrega', 'trocas-devolucoes']
      let deletedCount = 0
      
      for (const key of oldTermKeys) {
        // Primeiro verificar se existe
        const { data: existing, error: checkError } = await (supabase as any)
          .from('site_terms')
          .select('id, key')
          .eq('key', key)
          .maybeSingle()
        
        if (checkError && checkError.code !== 'PGRST116') {
          console.warn(`Erro ao verificar termo ${key}:`, checkError)
          continue
        }
        
        if (existing) {
          // Se existe, deletar
          const { error: deleteError } = await (supabase as any)
            .from('site_terms')
            .delete()
            .eq('key', key)
          
          if (deleteError) {
            console.error(`Erro ao deletar termo ${key}:`, deleteError)
            // Não mostrar toast para cada erro, apenas logar
          } else {
            console.log(`✓ Termo ${key} deletado com sucesso`)
            deletedCount++
          }
        }
      }
      
      if (deletedCount > 0) {
        // Recarregar termos após deletar
        await loadTerms()
        toast.success(`${deletedCount} termo(s) antigo(s) removido(s)`)
      }
    } catch (error) {
      console.error('Erro ao deletar termos antigos:', error)
      // Não mostrar toast de erro para não incomodar o usuário
    }
  }

  // Parsear conteúdo em seções quando termo é selecionado
  useEffect(() => {
    if (selectedTerm) {
      const term = terms.find(t => t.key === selectedTerm)
      if (term) {
        parseSections(term.content)
      }
    }
  }, [selectedTerm, terms])

  const parseSections = (content: string) => {
    if (!content) {
      setSections([])
      return
    }

    const lines = content.split('\n')
    const parsedSections: TermSection[] = []
    let currentSection: TermSection | null = null
    let foundFirstTitle = false
    let contentAfterFirstTitle = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Verificar se é um título
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)?.[0]?.length || 1
        const title = line.replace(/^#+\s*/, '').trim()
        
        // Ignorar o primeiro título principal (# Título) - ele é apenas o título do termo
        if (level === 1 && !foundFirstTitle) {
          foundFirstTitle = true
          // Se havia conteúdo após o título principal, criar uma seção inicial
          if (contentAfterFirstTitle.trim()) {
            currentSection = {
              id: `section-${Date.now()}-0`,
              title: 'Introdução',
              content: contentAfterFirstTitle.trim(),
              level: 2
            }
            contentAfterFirstTitle = ''
          }
          continue
        }
        
        // Salvar seção anterior se existir
        if (currentSection) {
          parsedSections.push(currentSection)
        }
        
        currentSection = {
          id: `section-${Date.now()}-${parsedSections.length}`,
          title,
          content: '',
          level: Math.min(level, 3) // Limitar a 3 níveis
        }
      } else if (currentSection && line) {
        // Adicionar conteúdo à seção atual
        currentSection.content += (currentSection.content ? '\n' : '') + line
      } else if (!foundFirstTitle && line) {
        // Conteúdo antes da primeira seção (após o título principal)
        contentAfterFirstTitle += (contentAfterFirstTitle ? '\n' : '') + line
      }
    }

    // Adicionar última seção
    if (currentSection) {
      parsedSections.push(currentSection)
    } else if (contentAfterFirstTitle.trim() && !foundFirstTitle) {
      // Se não encontrou título principal mas há conteúdo, criar seção inicial
      parsedSections.push({
        id: `section-${Date.now()}-0`,
        title: 'Introdução',
        content: contentAfterFirstTitle.trim(),
        level: 2
      })
    }

    setSections(parsedSections)
  }

  const buildContentFromSections = (sections: TermSection[]): string => {
    const mainTitle = terms.find(t => t.key === selectedTerm)?.title || 'Título'
    let content = `# ${mainTitle}\n\n`

    sections.forEach((section) => {
      // O nível já está correto (1 = #, 2 = ##, 3 = ###)
      const prefix = '#'.repeat(section.level)
      content += `${prefix} ${section.title}\n\n`
      
      if (section.content.trim()) {
        content += `${section.content.trim()}\n\n`
      }
    })

    return content.trim()
  }

  const loadTerms = async () => {
    try {
      setLoading(true)
      
      // Primeiro, deletar termos antigos que não devem mais existir
      const oldTermKeys = ['politica-entrega', 'trocas-devolucoes']
      for (const key of oldTermKeys) {
        await (supabase as any)
          .from('site_terms')
          .delete()
          .eq('key', key)
      }
      
      const { data, error } = await (supabase as any)
        .from('site_terms')
        .select('*')
        .order('key')

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data || data.length === 0) {
        const defaultTerms = TERMS_CONFIG.map(config => ({
          key: config.key,
          title: config.title,
          content: config.defaultContent,
          icon: config.icon,
        }))

        const { error: insertError } = await (supabase as any)
          .from('site_terms')
          .insert(defaultTerms)

        if (insertError && insertError.code !== '42P01') {
          console.error('Erro ao criar termos padrão:', insertError)
        } else {
          const { data: newData } = await (supabase as any)
            .from('site_terms')
            .select('*')
            .order('key')
          
          setTerms(newData as Term[] || [])
          if (newData && newData.length > 0) {
            setSelectedTerm(newData[0].key)
          }
        }
      } else {
        // Verificar se todos os termos padrão existem
        const existingKeys = data.map((t: any) => t.key)
        const missingTerms = TERMS_CONFIG.filter(config => !existingKeys.includes(config.key))
        
        if (missingTerms.length > 0) {
          // Inserir termos faltantes
          const termsToInsert = missingTerms.map(config => ({
            key: config.key,
            title: config.title,
            content: config.defaultContent,
            icon: config.icon,
          }))

          const { error: insertError } = await (supabase as any)
            .from('site_terms')
            .insert(termsToInsert)

          if (insertError && insertError.code !== '42P01') {
            console.error('Erro ao criar termos faltantes:', insertError)
          } else {
            // Recarregar termos após inserir os faltantes
            const { data: updatedData } = await (supabase as any)
              .from('site_terms')
              .select('*')
              .order('key')
            
            setTerms(updatedData as Term[] || data)
            if (updatedData && updatedData.length > 0 && !selectedTerm) {
              setSelectedTerm(updatedData[0].key)
            } else if (data.length > 0 && !selectedTerm) {
              setSelectedTerm(data[0].key)
            }
            return // Sair aqui para evitar duplicar o código abaixo
          }
        }
        
        setTerms(data as Term[])
        if (data.length > 0 && !selectedTerm) {
          setSelectedTerm(data[0].key)
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar termos:', error)
      if (error.code === '42P01' || error.code === 'PGRST116') {
        toast.error('Tabela de termos não existe. Execute o SQL de criação no Supabase.')
      } else {
        toast.error('Erro ao carregar termos')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedTerm) return

    const term = terms.find(t => t.key === selectedTerm)
    if (!term) return

    try {
      setSaving(true)
      const content = buildContentFromSections(sections)
      
      const { error } = await (supabase as any)
        .from('site_terms')
        .update({
          title: term.title,
          content: content,
          updated_at: new Date().toISOString(),
        })
        .eq('key', selectedTerm)

      if (error) throw error

      // Atualizar termo local
      setTerms(prev => prev.map(t => 
        t.key === selectedTerm ? { ...t, content, title: term.title } : t
      ))

      toast.success('Termo salvo com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar termo:', error)
      toast.error('Erro ao salvar termo')
    } finally {
      setSaving(false)
    }
  }

  const handleAddSection = () => {
    const newSection: TermSection = {
      id: `section-${Date.now()}`,
      title: 'Nova Seção',
      content: '',
      level: 2 // ## por padrão
    }
    setSections([...sections, newSection])
    setEditingSection(newSection.id)
  }

  const handleRemoveSection = (sectionId: string) => {
    if (!confirm('Tem certeza que deseja remover esta seção?')) return
    setSections(sections.filter(s => s.id !== sectionId))
    if (editingSection === sectionId) {
      setEditingSection(null)
    }
  }

  const handleUpdateSection = (sectionId: string, updates: Partial<TermSection>) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, ...updates } : s
    ))
  }

  const buildContentFromNewTermSections = (sections: TermSection[], title: string): string => {
    let content = `# ${title}\n\n`

    sections.forEach((section) => {
      const prefix = '#'.repeat(section.level)
      content += `${prefix} ${section.title}\n\n`
      
      if (section.content.trim()) {
        content += `${section.content.trim()}\n\n`
      }
    })

    return content.trim()
  }

  const handleCreateNewTerm = async () => {
    if (!newTerm.title || newTerm.title.trim() === '') {
      toast.error('Preencha o título do termo')
      return
    }

    try {
      setSaving(true)
      // Gerar chave automaticamente a partir do título
      const key = slugify(newTerm.title)
      
      if (!key || key.length === 0) {
        toast.error('O título precisa ter pelo menos um caractere válido')
        return
      }
      
      // Verificar se já existe
      const { data: existing, error: checkError } = await (supabase as any)
        .from('site_terms')
        .select('key')
        .eq('key', key)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existing) {
        toast.error('Já existe um termo com este título. Tente outro título.')
        return
      }

      // Construir conteúdo a partir das seções criadas
      const content = buildContentFromNewTermSections(newTermSections, newTerm.title)

      const { error } = await (supabase as any)
        .from('site_terms')
        .insert({
          key,
          title: newTerm.title.trim(),
          content,
          icon: newTerm.icon,
        })

      if (error) {
        console.error('Erro detalhado ao criar termo:', error)
        throw error
      }

      toast.success('Termo criado com sucesso!')
      setShowNewTermModal(false)
      setNewTerm({ title: '', icon: 'file-text' })
      setNewTermSections([{
        id: `section-${Date.now()}-0`,
        title: 'Primeira Seção',
        content: '',
        level: 2
      }])
      await loadTerms()
      // Aguardar um pouco para garantir que o termo foi carregado
      setTimeout(() => {
        setSelectedTerm(key)
        // Parsear as seções do conteúdo criado
        parseSections(content)
      }, 300)
    } catch (error: any) {
      console.error('Erro ao criar termo:', error)
      toast.error(error.message || 'Erro ao criar termo. Verifique o console para mais detalhes.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTerm = async (termKey: string) => {
    if (!confirm('Tem certeza que deseja excluir este termo? Esta ação não pode ser desfeita.')) return

    try {
      const { error } = await (supabase as any)
        .from('site_terms')
        .delete()
        .eq('key', termKey)

      if (error) throw error

      toast.success('Termo excluído com sucesso!')
      setTerms(terms.filter(t => t.key !== termKey))
      
      if (selectedTerm === termKey) {
        const remaining = terms.filter(t => t.key !== termKey)
        setSelectedTerm(remaining.length > 0 ? remaining[0].key : null)
      }
    } catch (error: any) {
      console.error('Erro ao excluir termo:', error)
      toast.error('Erro ao excluir termo')
    }
  }

  const handleTitleChange = (key: string, title: string) => {
    setTerms(prev => prev.map(t => 
      t.key === key ? { ...t, title } : t
    ))
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'shield':
        return <Shield className="w-5 h-5" />
      case 'file-text':
        return <FileText className="w-5 h-5" />
      case 'truck':
        return <Truck className="w-5 h-5" />
      case 'rotate-ccw':
        return <RotateCcw className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  const currentTerm = terms.find(t => t.key === selectedTerm)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <DashboardNavigation
          title="Gerenciar Termos"
          subtitle="Edite os termos e políticas do site"
          backUrl="/dashboard"
          backLabel="Dashboard"
        />

        <div className="flex justify-end mb-6">
          <Button onClick={() => setShowNewTermModal(true)} size="lg">
            <Plus size={18} className="mr-2" />
            Criar Novo Termo
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
          {/* Lista de Termos */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-bold text-lg mb-4">Termos Disponíveis</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {terms.map((term) => (
                  <div
                    key={term.key}
                    className={`group flex items-center justify-between p-3 rounded-lg transition-colors ${
                      selectedTerm === term.key
                        ? 'bg-black text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedTerm(term.key)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      {getIcon(term.icon || 'file-text')}
                      <span className="font-medium text-sm">{term.title}</span>
                    </button>
                    {selectedTerm !== term.key && (
                      <button
                        onClick={() => handleDeleteTerm(term.key)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-600 transition-opacity"
                        title="Excluir termo"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Editor de Termo */}
          <div className="lg:col-span-3">
            {currentTerm ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    {getIcon(currentTerm.icon || 'file-text')}
                    <h2 className="text-2xl font-bold">{currentTerm.title}</h2>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} isLoading={saving} size="lg">
                      <Save size={18} className="mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <Input
                    label="Título do Termo"
                    value={currentTerm.title}
                    onChange={(e) => handleTitleChange(currentTerm.key, e.target.value)}
                    placeholder="Título do termo"
                  />
                </div>

                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Seções do Termo</h3>
                    <Button onClick={handleAddSection} size="sm" variant="outline">
                      <Plus size={16} className="mr-2" />
                      Adicionar Seção
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {sections.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>Nenhuma seção encontrada. Clique em "Adicionar Seção" para começar.</p>
                      </div>
                    ) : (
                      sections.map((section, index) => (
                        <div
                          key={section.id}
                          className="border rounded-lg p-4 hover:border-black transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-1">
                              <select
                                value={section.level}
                                onChange={(e) => handleUpdateSection(section.id, { level: parseInt(e.target.value) })}
                                className="text-xs border rounded px-2 py-1"
                              >
                                <option value={1}>Título Principal (#)</option>
                                <option value={2}>Seção (##)</option>
                                <option value={3}>Subseção (###)</option>
                              </select>
                              {editingSection === section.id ? (
                                <Input
                                  value={section.title}
                                  onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                                  placeholder="Título da seção"
                                  className="flex-1"
                                />
                              ) : (
                                <h4
                                  className={`font-bold cursor-pointer flex-1 ${
                                    section.level === 1 ? 'text-xl' :
                                    section.level === 2 ? 'text-lg' : 'text-base'
                                  }`}
                                  onClick={() => setEditingSection(section.id)}
                                >
                                  {section.title || 'Sem título'}
                                </h4>
                              )}
                              {editingSection === section.id && (
                                <Button
                                  onClick={() => setEditingSection(null)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <X size={14} />
                                </Button>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveSection(section.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remover seção"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <textarea
                            value={section.content}
                            onChange={(e) => handleUpdateSection(section.id, { content: e.target.value })}
                            placeholder="Conteúdo da seção (suporta Markdown: listas com -, negrito com **texto**)..."
                            rows={6}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500">Selecione um termo para editar ou crie um novo termo</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal para criar novo termo */}
        {showNewTermModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowNewTermModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative"
            >
              <button
                onClick={() => setShowNewTermModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>

              <h3 className="text-2xl font-bold mb-6">Criar Novo Termo</h3>

              <div className="space-y-4">
                <Input
                  label="Título do Termo *"
                  value={newTerm.title}
                  onChange={(e) => setNewTerm({ ...newTerm, title: e.target.value })}
                  placeholder="Ex: Política de Reembolso"
                />

                <div>
                  <label className="block text-sm font-medium mb-2">Ícone</label>
                  <select
                    value={newTerm.icon}
                    onChange={(e) => setNewTerm({ ...newTerm, icon: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="file-text">📄 Documento</option>
                    <option value="shield">🛡️ Escudo</option>
                    <option value="truck">🚚 Caminhão</option>
                    <option value="rotate-ccw">🔄 Troca</option>
                  </select>
                </div>

                <div className="border-t pt-4 mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Seções do Termo</h3>
                    <Button 
                      onClick={() => {
                        const newSection: TermSection = {
                          id: `section-${Date.now()}`,
                          title: 'Nova Seção',
                          content: '',
                          level: 2
                        }
                        setNewTermSections([...newTermSections, newSection])
                      }} 
                      size="sm" 
                      variant="outline"
                    >
                      <Plus size={16} className="mr-2" />
                      Adicionar Seção
                    </Button>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {newTermSections.map((section, index) => (
                      <div
                        key={section.id}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-1">
                            <select
                              value={section.level}
                              onChange={(e) => {
                                const updated = newTermSections.map(s => 
                                  s.id === section.id ? { ...s, level: parseInt(e.target.value) } : s
                                )
                                setNewTermSections(updated)
                              }}
                              className="text-xs border rounded px-2 py-1"
                            >
                              <option value={1}>Título Principal (#)</option>
                              <option value={2}>Seção (##)</option>
                              <option value={3}>Subseção (###)</option>
                            </select>
                            <Input
                              value={section.title}
                              onChange={(e) => {
                                const updated = newTermSections.map(s => 
                                  s.id === section.id ? { ...s, title: e.target.value } : s
                                )
                                setNewTermSections(updated)
                              }}
                              placeholder="Título da seção"
                              className="flex-1"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (newTermSections.length > 1) {
                                setNewTermSections(newTermSections.filter(s => s.id !== section.id))
                              } else {
                                toast.error('É necessário ter pelo menos uma seção')
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover seção"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <textarea
                          value={section.content}
                          onChange={(e) => {
                            const updated = newTermSections.map(s => 
                              s.id === section.id ? { ...s, content: e.target.value } : s
                            )
                            setNewTermSections(updated)
                          }}
                          placeholder="Conteúdo da seção (suporta Markdown: listas com -, negrito com **texto**)..."
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleCreateNewTerm} isLoading={saving} className="flex-1" size="lg">
                    <Plus size={18} className="mr-2" />
                    Criar Termo
                  </Button>
                  <Button
                    onClick={() => {
                      setShowNewTermModal(false)
                      setNewTerm({ title: '', icon: 'file-text' })
                      setNewTermSections([{
                        id: `section-${Date.now()}-0`,
                        title: 'Primeira Seção',
                        content: '',
                        level: 2
                      }])
                    }}
                    variant="outline"
                    size="lg"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
