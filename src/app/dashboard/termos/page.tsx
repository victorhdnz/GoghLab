'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation'
import { createClient } from '@/lib/supabase/client'
import { Save, FileText, Shield, Truck, RotateCcw, Plus, Trash2, Edit, X } from 'lucide-react'
import { LumaSpin } from '@/components/ui/luma-spin'
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

// Chaves dos termos que a plataforma utiliza (Gogh Lab — plataforma digital, sem e-commerce)
const ALLOWED_TERM_KEYS = [
  'politica-privacidade',
  'termos-uso',
  'termos-login-google',
  'termos-assinatura-planos',
  'termos-servicos',
]

const TERMS_CONFIG = [
  {
    key: 'politica-privacidade',
    title: 'Política de Privacidade',
    icon: 'shield',
    defaultContent: `# Política de Privacidade

## 1. Introdução

O Gogh Lab ("nós", "nosso" ou "plataforma") é uma plataforma digital de ferramentas e recursos com inteligência artificial voltada a criadores de conteúdo. Esta Política de Privacidade descreve como tratamos suas informações pessoais ao utilizar nosso site, aplicação e serviços.

Ao acessar ou usar a plataforma Gogh Lab, você concorda com o tratamento dos seus dados conforme descrito nesta política. Em caso de discordância, solicitamos que não utilize nossos serviços.

## 2. Dados que Coletamos

### 2.1. Dados fornecidos por você

- **Conta e autenticação**: nome, e-mail, foto de perfil (quando utiliza login com Google ou cadastro por e-mail)
- **Pagamento**: os dados de cartão e pagamento são processados diretamente pela Stripe; não armazenamos número completo de cartão
- **Comunicação**: mensagens enviadas por e-mail, WhatsApp ou canais oficiais da plataforma
- **Uso da plataforma**: conteúdo que você gera (textos, preferências), interações com agentes de IA e ferramentas, dentro dos limites e finalidades do serviço

### 2.2. Dados coletados automaticamente

- **Uso do site**: endereço IP, tipo de navegador, páginas visitadas, tempo de uso, para melhorar a experiência e a segurança
- **Cookies e tecnologias similares**: para sessão, preferências e análise de uso, conforme esta política e nossa configuração de cookies

## 3. Finalidades do Tratamento

Utilizamos seus dados para:

- Criar e gerenciar sua conta e acesso à plataforma
- Prestar os serviços contratados (planos de assinatura, ferramentas, cursos, agentes de IA)
- Processar pagamentos e renovação de assinaturas (via Stripe)
- Enviar comunicações sobre a conta, serviços, alterações importantes e, quando autorizado, ofertas e novidades
- Garantir segurança, prevenir fraudes e cumprir obrigações legais
- Melhorar produtos, recursos e experiência do usuário (incluindo análises agregadas e anônimas)

## 4. Base Legal (LGPD)

O tratamento dos seus dados pessoais está fundamentado, conforme o caso, em: execução de contrato (prestação dos serviços), consentimento (quando aplicável), cumprimento de obrigação legal e legítimo interesse (segurança, melhorias, comunicação essencial).

## 5. Compartilhamento de Dados

Não vendemos seus dados pessoais. Podemos compartilhar dados apenas:

- Com **prestadores de serviço** necessários à operação (hospedagem, e-mail, pagamento via Stripe, autenticação), sob obrigações de confidencialidade e segurança
- Por **exigência legal** ou decisão de autoridade competente
- Com seu **consentimento** explícito, quando aplicável

## 6. Retenção e Exclusão

Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas e obrigações legais. Após o encerramento da conta ou fim da relação contratual, podemos reter dados por período legal ou para exercício de direitos. Você pode solicitar acesso, correção, anonimização ou exclusão dos dados, nos termos da LGPD, através dos canais de contato indicados abaixo.

## 7. Segurança

Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição, em conformidade com as boas práticas e a LGPD.

## 8. Alterações

Podemos atualizar esta Política de Privacidade. Alterações relevantes serão comunicadas por e-mail ou aviso na plataforma. O uso continuado após a divulgação constitui aceitação da nova versão.

## 9. Contato

Para dúvidas, exercício de direitos ou reclamações sobre privacidade:

- **E-mail**: contato.goghlab@gmail.com
- **WhatsApp**: [número configurado na plataforma]

**Última atualização**: Janeiro de 2026`,
  },
  {
    key: 'termos-uso',
    title: 'Termos de Uso',
    icon: 'file-text',
    defaultContent: `# Termos de Uso

## 1. Aceitação

Ao acessar e utilizar o site e os serviços do Gogh Lab, você concorda com estes Termos de Uso e com nossa Política de Privacidade. O Gogh Lab é uma plataforma digital que oferece ferramentas, agentes de IA, cursos e recursos para criadores de conteúdo. Se você não concordar com alguma parte destes termos, não deve utilizar a plataforma.

## 2. Descrição dos Serviços

O Gogh Lab oferece:

- **Homepage e divulgação**: o site apresenta a plataforma, cases e informações. Os planos e preços estão disponíveis em página dedicada (/precos).
- **Área de membros**: após login e, quando aplicável, assinatura ativa, o usuário acessa agentes e recursos de IA (chat), ferramentas profissionais integradas ao plano, cursos e outros recursos do plano contratado.
- **Criação com IA**: funcionalidades de geração de conteúdo (texto, imagens, vídeos, roteiros, etc.) sujeitas aos limites do plano e à política de uso.

O uso efetivo de recursos que exijam assinatura está condicionado à contratação de um plano e ao cumprimento dos Termos de Assinatura e Planos.

## 3. Uso Adequado da Plataforma

Você concorda em utilizar a plataforma apenas para fins legais e lícitos, e em não:

- Utilizar o serviço de forma fraudulenta ou para burlar limites ou restrições
- Danificar, sobrecarregar ou comprometer a infraestrutura ou a experiência de outros usuários
- Tentar obter acesso não autorizado a sistemas, contas ou dados de terceiros
- Transmitir vírus, malware ou qualquer conteúdo que prejudique a plataforma ou terceiros
- Violar direitos de propriedade intelectual ou de imagem do Gogh Lab ou de terceiros
- Utilizar a plataforma para atividades ilegais ou que violem políticas de terceiros (redes sociais, provedores, etc.)

A violação destas regras pode resultar em suspensão ou encerramento da conta, sem prejuízo de outras medidas legais.

## 4. Conta e Responsabilidade

- Você é responsável por manter a confidencialidade do acesso à sua conta e por todas as atividades realizadas nela.
- Deve fornecer informações verdadeiras e atualizadas e notificar-nos sobre uso não autorizado.
- Menores de 18 anos devem utilizar a plataforma com supervisão e responsabilidade do responsável legal.

## 5. Planos e Preços

Os planos de assinatura, preços, recursos e limites estão descritos na página de planos (/precos) e nos Termos de Assinatura e Planos. Alterações de preços ou condições para novos ciclos serão comunicadas conforme a legislação aplicável. O uso da plataforma após a contratação implica aceitação desses termos específicos.

## 6. Propriedade Intelectual

Todo o conteúdo da plataforma (textos, marcas, interfaces, cursos, agentes de IA e demais materiais) é de propriedade do Gogh Lab ou de seus licenciadores e está protegido por leis de propriedade intelectual. O conteúdo que você gerar por meio dos recursos da plataforma é de sua responsabilidade; você não pode usar a plataforma para violar direitos de terceiros nem para treinar ou alimentar modelos de IA concorrentes sem autorização.

## 7. Limitação de Responsabilidade

A plataforma é fornecida "como está". Na medida permitida pela lei, o Gogh Lab não se responsabiliza por danos indiretos, incidentais, consequenciais ou punitivos, incluindo perda de dados ou lucros. Não garantimos resultados específicos do uso de ferramentas ou de IA. Em nenhuma hipótese nossa responsabilidade total excederá o valor pago por você nos últimos 12 meses em relação aos serviços do Gogh Lab.

## 8. Alterações nos Termos

Reservamo-nos o direito de modificar estes Termos de Uso. Alterações relevantes serão comunicadas por e-mail ou aviso na plataforma. O uso continuado após a divulgação constitui aceitação dos novos termos.

## 9. Lei Aplicável e Foro

Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será submetida ao foro da comarca de Uberlândia/MG, com renúncia a qualquer outro, por mais privilegiado que seja.

## 10. Contato

Para dúvidas sobre estes Termos de Uso:

- **E-mail**: contato.goghlab@gmail.com
- **WhatsApp**: [número configurado na plataforma]

**Última atualização**: Janeiro de 2026`,
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

A autenticação é realizada através da plataforma Google OAuth, utilizando suas credenciais da conta Google. Ao clicar em "Continuar com Google", você será redirecionado para a página de autenticação do Google, onde deverá autorizar o acesso do Gogh Lab aos dados básicos da sua conta.

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
- Notificar imediatamente o Gogh Lab sobre qualquer uso não autorizado da sua conta
- Garantir que possui autorização para utilizar a conta Google informada
- Todas as atividades realizadas através da sua conta autenticada

### 3.2. Uso Adequado

Você concorda em:

- Utilizar a plataforma apenas para fins legais e lícitos
- Não compartilhar suas credenciais de acesso com terceiros
- Não realizar atividades que possam comprometer a segurança da plataforma
- Respeitar os direitos de propriedade intelectual do Gogh Lab e de terceiros

## 4. Privacidade e Proteção de Dados

### 4.1. Conformidade Legal

O Gogh Lab está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e demais legislações aplicáveis. O tratamento dos seus dados pessoais segue rigorosamente os princípios estabelecidos na legislação vigente.

### 4.2. Compartilhamento de Dados

O Gogh Lab **não compartilha, vende ou aluga** seus dados pessoais para terceiros, exceto:

- Quando necessário para o cumprimento de obrigações legais
- Com seu consentimento expresso
- Para prestação de serviços essenciais (processamento de pagamentos, hospedagem, etc.), sempre com garantias de proteção adequadas

### 4.3. Retenção de Dados

Seus dados serão mantidos enquanto sua conta estiver ativa ou enquanto necessário para cumprimento de obrigações legais. Você pode solicitar a exclusão dos seus dados a qualquer momento, conforme previsto na LGPD.

## 5. Limitações de Responsabilidade

### 5.1. Serviços de Terceiros

O Gogh Lab utiliza os serviços de autenticação do Google, que são fornecidos e gerenciados exclusivamente pela Google LLC. O Gogh Lab **não se responsabiliza** por:

- Falhas, interrupções ou indisponibilidades dos serviços de autenticação do Google
- Problemas de segurança que ocorram na infraestrutura do Google
- Alterações nas políticas ou termos de serviço do Google que possam afetar a autenticação

### 5.2. Disponibilidade do Serviço

Embora nos esforcemos para manter a plataforma sempre disponível, não garantimos que o serviço estará livre de interrupções, erros ou falhas técnicas. O Gogh Lab não se responsabiliza por perdas ou danos decorrentes de indisponibilidade temporária do serviço.

## 6. Modificações nos Termos

O Gogh Lab reserva-se o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após sua publicação na plataforma. É sua responsabilidade revisar periodicamente estes termos. O uso continuado da plataforma após as modificações constitui aceitação dos novos termos.

## 7. Rescisão

O Gogh Lab reserva-se o direito de suspender ou encerrar sua conta, a qualquer momento e sem aviso prévio, em caso de:

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

O Gogh Lab oferece os seguintes planos de assinatura:

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

A descrição completa dos recursos, limites de uso mensais e benefícios de cada plano está disponível na **página de planos e preços** da plataforma (/precos). É sua responsabilidade revisar cuidadosamente as especificações de cada plano antes da contratação.

### 2.3. Limites de Uso

Cada plano possui limites específicos de uso mensal para determinados recursos, incluindo, mas não se limitando a:

- **Uso de agentes e modelos de IA**: Limites de mensagens, interações ou geração de conteúdo conforme o plano
- **Acesso a Cursos**: Quantidade e tipo de cursos disponíveis
- **Acesso a Ferramentas**: Disponibilidade e limites de uso das ferramentas profissionais e de criação integradas ao plano
- **Suporte**: Nível e prioridade de suporte disponível

Os limites são resetados a cada início de período de cobrança (mensal ou anual, conforme o plano). O não uso dos limites em um período não gera créditos ou acúmulo para períodos futuros.

### 2.4. Acesso às Ferramentas Profissionais

#### 2.4.1. Período de Liberação

Conforme o Código de Defesa do Consumidor (CDC), você tem 7 (sete) dias corridos a partir da data de contratação para exercer seu direito de arrependimento e solicitar reembolso total.

Para garantir que o período de arrependimento seja respeitado e evitar que credenciais de acesso sejam fornecidas antes do término deste prazo, o **acesso às ferramentas profissionais integradas ao plano será liberado apenas a partir do oitavo dia** após a data de início da sua assinatura.

**IMPORTANTE:** Esta regra se aplica tanto para **compras iniciais** (primeira contratação de um plano) quanto para **renovações** (renovação automática ou manual da assinatura). Em ambos os casos, o período de espera de 8 dias é contado a partir da data de início do novo período de assinatura (current_period_start), garantindo que o direito de arrependimento seja respeitado em cada ciclo contratual.

**ISENÇÃO DE RESPONSABILIDADE:** Ao contratar qualquer plano de assinatura, você reconhece e aceita expressamente que o acesso às ferramentas profissionais estará disponível apenas a partir do oitavo dia após o início da sua assinatura (ou renovação), e que este período de espera é uma condição essencial do contrato, estabelecida para garantir o cumprimento do período de arrependimento previsto no CDC. Você concorda que não terá direito a qualquer tipo de compensação, reembolso parcial, desconto ou indenização em decorrência deste período de espera, e que esta condição não constitui falha na prestação do serviço ou descumprimento contratual por parte do Gogh Lab.

#### 2.4.2. Processo de Solicitação

- Após o oitavo dia da assinatura (seja compra inicial ou renovação), você poderá solicitar acesso às ferramentas através da área de membros
- A solicitação será processada e o acesso será liberado em até 24 horas após a aprovação
- Você receberá as credenciais de acesso às ferramentas através da plataforma

#### 2.4.3. Período de Uso

Após a liberação do acesso, você terá **30 (trinta) dias de uso** das ferramentas disponibilizadas, contados a partir da data de liberação das credenciais. Este período é independente do ciclo de cobrança da sua assinatura e visa garantir que você tenha tempo suficiente para aproveitar os recursos.

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

### 4.2. Cancelamento pelo Gogh Lab

O Gogh Lab reserva-se o direito de cancelar sua assinatura, sem reembolso, em caso de:

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
- Após o período de arrependimento, **não há direito a reembolso**, exceto em casos específicos previstos em lei ou por decisão do Gogh Lab, a seu exclusivo critério

#### 4.3.3. Processamento do Reembolso
- O reembolso será processado no mesmo método de pagamento utilizado na contratação
- O prazo para crédito na conta pode variar de 5 a 10 dias úteis, dependendo da instituição financeira

## 5. Alterações nos Planos

### 5.1. Alteração de Plano pelo Usuário

Você pode fazer upgrade (mudança para plano superior) ou downgrade (mudança para plano inferior) a qualquer momento através da área de membros. As alterações terão efeito imediato, com ajuste proporcional na cobrança.

### 5.2. Alterações pelo Gogh Lab

O Gogh Lab reserva-se o direito de:

- Modificar recursos, limites de uso ou preços dos planos a qualquer momento
- Adicionar ou remover recursos de qualquer plano
- Descontinuar planos específicos (com aviso prévio de 30 dias)

Alterações que reduzam significativamente os recursos do seu plano atual serão comunicadas com antecedência mínima de 30 dias, e você terá direito a cancelar sem penalidades.

## 6. Disponibilidade e Uptime

### 6.1. Disponibilidade do Serviço

O Gogh Lab se esforça para manter a plataforma disponível 24 horas por dia, 7 dias por semana. No entanto, não garantimos disponibilidade ininterrupta e não nos responsabilizamos por:

- Manutenções programadas ou de emergência
- Falhas técnicas ou de infraestrutura
- Problemas de conectividade de internet do usuário
- Indisponibilidade de serviços de terceiros (Stripe, Google, etc.)

## 7. Limites de Uso e Fair Use

### 7.1. Uso Razoável

Os recursos da plataforma devem ser utilizados de forma razoável e dentro dos limites estabelecidos para cada plano. O Gogh Lab reserva-se o direito de:

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

Todo o conteúdo da plataforma, incluindo textos, imagens, vídeos, cursos, agentes e recursos de IA, e demais materiais, é de propriedade exclusiva do Gogh Lab ou de seus licenciadores, protegido por leis de propriedade intelectual.

### 8.2. Conteúdo Gerado pelo Usuário

Conteúdo gerado através dos recursos da plataforma (textos, imagens, etc.) é de propriedade do usuário, desde que não viole direitos de terceiros. O Gogh Lab não reivindica propriedade sobre conteúdo gerado pelo usuário.

### 8.3. Uso de Conteúdo

O uso dos recursos da plataforma é pessoal e não transferível. É proibido:

- Reproduzir, distribuir ou comercializar conteúdo da plataforma sem autorização
- Utilizar conteúdo da plataforma para treinar ou alimentar modelos de IA de terceiros ou concorrentes
- Realizar engenharia reversa ou descompilação de qualquer parte da plataforma

## 9. Limitação de Responsabilidade

### 9.1. Isenção de Garantias

A plataforma é fornecida "como está", sem garantias expressas ou implícitas de qualquer natureza. O Gogh Lab não garante que:

- A plataforma atenderá todas as suas necessidades
- Os resultados obtidos serão exatos ou adequados aos seus objetivos
- A plataforma estará livre de erros, vírus ou outros componentes prejudiciais

### 9.2. Limitação de Danos

O Gogh Lab não se responsabiliza por:

- Perdas diretas, indiretas, incidentais ou consequenciais decorrentes do uso ou impossibilidade de uso da plataforma
- Perda de dados, receitas, oportunidades de negócio ou lucros cessantes
- Danos resultantes de falhas técnicas, interrupções ou indisponibilidade do serviço

### 9.3. Limite Máximo de Responsabilidade

Em nenhuma hipótese a responsabilidade total do Gogh Lab excederá o valor pago pelo usuário nos últimos 12 (doze) meses pela assinatura.

## 10. Proteção de Dados

### 10.1. Tratamento de Dados

O tratamento dos seus dados pessoais segue rigorosamente a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). Para mais informações, consulte nossa Política de Privacidade.

### 10.2. Dados de Pagamento

Dados de pagamento são processados exclusivamente pela Stripe, em conformidade com os mais altos padrões de segurança (PCI DSS). O Gogh Lab não armazena informações completas de cartão de crédito.

## 11. Modificações nos Termos

O Gogh Lab reserva-se o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas com antecedência mínima de 30 dias. O uso continuado da plataforma após as modificações constitui aceitação dos novos termos.

## 12. Resolução de Conflitos

### 12.1. Tentativa de Resolução Amigável

Em caso de conflitos, as partes se comprometem a tentar resolver a questão de forma amigável através de comunicação direta.

### 12.2. Mediação

Caso não seja possível resolver amigavelmente, as partes podem optar por mediação antes de recorrer ao Poder Judiciário.

## 13. Lei Aplicável e Foro

Estes termos são regidos pela legislação brasileira. Qualquer controvérsia decorrente destes termos será resolvida no foro da comarca de Uberlândia/MG, renunciando as partes a qualquer outro, por mais privilegiado que seja.

## 14. Disposições Gerais

### 14.1. Integralidade

Estes termos, juntamente com a Política de Privacidade e demais políticas da plataforma, constituem o acordo integral entre você e o Gogh Lab.

### 14.2. Tolerância

A tolerância de qualquer violação destes termos não constitui renúncia de direitos pelo Gogh Lab.

### 14.3. Divisibilidade

Se qualquer disposição destes termos for considerada inválida ou inexequível, as demais disposições permanecerão em pleno vigor.

## 15. Contato

Para questões relacionadas a assinaturas, pagamentos ou estes termos, entre em contato através de:

- **E-mail**: contato.goghlab@gmail.com
- **WhatsApp**: [número configurado na plataforma]
- **Portal de Gerenciamento**: Acesse sua área de membros para gerenciar sua assinatura

**Última atualização**: Janeiro de 2026`,
  },
  {
    key: 'termos-servicos',
    title: 'Termos de Serviços Personalizados',
    icon: 'file-text',
    defaultContent: `# Termos de Serviços Personalizados

## 1. Escopo dos Serviços

Os serviços personalizados incluem, quando contratados, atividades como: marketing (tráfego pago), criação de sites completos, criação de conteúdo (roteiro, produção e pós-produção) e gestão de redes sociais. A descrição detalhada de cada serviço contratado será apresentada no momento da compra.

## 2. Seleção e Personalização

Os serviços podem ser combinados e personalizados conforme sua escolha. O valor total será calculado com base nos serviços selecionados e no ciclo de cobrança escolhido (mensal ou anual).

## 3. Prazos e Entregas

Prazos de início, cronograma de execução e entregas específicas serão definidos após a confirmação do pagamento e alinhamento inicial com o usuário. Alterações de escopo podem impactar prazos e custos.

## 4. Responsabilidades do Usuário

Para a execução dos serviços, o usuário se compromete a fornecer informações, acessos e materiais necessários em tempo hábil. A falta de informações pode gerar atrasos no cronograma.

## 5. Cancelamento e Reembolso

Serviços personalizados são iniciados após a confirmação do pagamento e do alinhamento inicial. Regras de cancelamento e reembolso seguem as condições previstas nos Termos de Assinatura e Planos e na legislação aplicável.

## 6. Comunicação e Aprovação

As aprovações de materiais, campanhas e conteúdos serão feitas pelos canais oficiais da plataforma. Caso não haja retorno em tempo razoável, o cronograma poderá ser ajustado.

## 7. Limitação de Responsabilidade

O Gogh Lab não garante resultados específicos (como volume de vendas ou crescimento de audiência), pois dependem de múltiplos fatores externos.

## 8. Alterações

O Gogh Lab pode atualizar estes termos mediante aviso prévio. A continuidade do uso ou contratação implica concordância com as alterações.

## Quantidades e Escopo Mensal (Serviços com limite)

Para garantir qualidade e previsibilidade, os seguintes serviços possuem quantidade mensal definida, válida tanto para cobrança mensal quanto anual:

- **Criação de conteúdo completa:** até 10 (dez) conteúdos por mês (posts, reels, artes ou mix conforme combinado).
- **Gestão de redes sociais:** até 12 (doze) publicações por mês no total nas redes gerenciadas.

Alterações de escopo ou quantidades acima podem ser tratadas sob demanda, mediante alinhamento prévio e eventual ajuste de valor.

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
    loadTerms()
  }, [])

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
          level: Math.min(level, 4) // Suportar até 4 níveis (####)
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
      // O nível já está correto (1 = #, 2 = ##, 3 = ###, 4 = ####)
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
      
      const { data, error } = await (supabase as any)
        .from('site_terms')
        .select('*')
        .order('key')

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data || data.length === 0) {
        const defaultTerms = TERMS_CONFIG.map((config) => ({
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
        // Verificar se todos os termos padrão (TERMS_CONFIG) existem e inserir os faltantes
        const existingKeys = data.map((t: any) => t.key)
        const missingTerms = TERMS_CONFIG.filter((config) => !existingKeys.includes(config.key))
        
        if (missingTerms.length > 0) {
          const termsToInsert = missingTerms.map((config) => ({
            key: config.key,
            title: config.title,
            content: config.defaultContent,
            icon: config.icon,
          }))

          const { error: insertError } = await (supabase as any)
            .from('site_terms')
            .insert(termsToInsert)

          if (!insertError || insertError.code === '42P01') {
            const { data: updatedData } = await (supabase as any)
              .from('site_terms')
              .select('*')
              .order('key')
            const finalData = (updatedData || data) as any[]
            const allowedData = finalData.filter((t) => ALLOWED_TERM_KEYS.includes(t.key))
            setTerms(allowedData as Term[])
            if (allowedData.length > 0 && !selectedTerm) {
              setSelectedTerm(allowedData[0].key)
            }
          } else {
            console.error('Erro ao criar termos faltantes:', insertError)
            const allowedData = (data as any[]).filter((t) => ALLOWED_TERM_KEYS.includes(t.key))
            setTerms(allowedData as Term[])
            if (allowedData.length > 0 && !selectedTerm) {
              setSelectedTerm(allowedData[0].key)
            }
          }
        } else {
          // Mostrar apenas termos permitidos (alinhados à estratégia atual da plataforma)
          const allowedData = (data as any[]).filter((t) => ALLOWED_TERM_KEYS.includes(t.key))
          setTerms(allowedData as Term[])
          if (allowedData.length > 0 && !selectedTerm) {
            setSelectedTerm(allowedData[0].key)
          }
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
        <LumaSpin size="default" />
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
