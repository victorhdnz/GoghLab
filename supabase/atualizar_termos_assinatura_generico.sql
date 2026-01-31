-- ==========================================
-- ATUALIZAR TERMOS DE ASSINATURA E PLANOS - LINGUAGEM GENÉRICA
-- ==========================================
-- Este script atualiza o conteúdo dos Termos de Assinatura e Planos para
-- não especificar nomes de produtos/ferramentas (ex: Canva, CapCut).
-- Inclui: acessos através de contas novas todos os meses; prazo de 8 dias
-- ou liberação imediata conforme configuração de cada ferramenta.
-- ==========================================
-- INSTRUÇÕES: Execute no SQL Editor do Supabase Dashboard
-- ==========================================

UPDATE site_terms
SET 
  content = '# Termos de Assinatura e Planos

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
- **Recursos**: Acesso completo aos recursos do plano Essencial, conforme descrição do plano
- **Limites de Uso**: Conforme especificado na descrição detalhada do plano
- **Renovação**: Automática, conforme ciclo contratado

#### 2.1.3. Plano Gogh Pro
- **Custo**: Conforme valores divulgados na plataforma
- **Ciclo de Cobrança**: Mensal ou Anual (conforme selecionado)
- **Recursos**: Acesso completo a todos os recursos da plataforma incluídos no plano Pro
- **Limites de Uso**: Conforme especificado na descrição detalhada do plano
- **Renovação**: Automática, conforme ciclo contratado

### 2.2. Descrição Detalhada dos Recursos

A descrição completa dos recursos, limites de uso mensais e benefícios de cada plano está disponível na página de planos da plataforma. É sua responsabilidade revisar cuidadosamente as especificações de cada plano antes da contratação.

### 2.3. Limites de Uso

Cada plano possui limites específicos de uso mensal para determinados recursos, incluindo, mas não se limitando a:

- **Acesso a Cursos**: Quantidade e tipo de cursos disponíveis conforme o plano
- **Acesso a Ferramentas**: Disponibilidade e limites de uso das ferramentas incluídas no plano
- **Prompts e Recursos Digitais**: Conforme descrito em cada plano
- **Suporte**: Nível e prioridade de suporte disponível

Os limites são resetados a cada início de período de cobrança (mensal ou anual, conforme o plano). O não uso dos limites em um período não gera créditos ou acúmulo para períodos futuros.

### 2.4. Acesso às Ferramentas Incluídas no Plano

#### 2.4.1. Fornecimento de Acessos

**Todos os acessos às ferramentas e recursos incluídos no seu plano são fornecidos através de contas novas todos os meses.** Ou seja, a cada ciclo (mensal ou anual), as credenciais ou links de acesso podem ser renovados/alterados, garantindo que o serviço seja prestado em conformidade com as políticas da plataforma e dos provedores das ferramentas.

Os acessos às ferramentas disponíveis no seu plano são liberados na área de membros, na seção de Ferramentas, onde você pode solicitar o acesso às ferramentas que seu plano inclui. Está descrito nos termos e na plataforma quais ferramentas cada plano contempla.

#### 2.4.2. Período de Liberação (quando aplicável)

Conforme o Código de Defesa do Consumidor (CDC), você tem 7 (sete) dias corridos a partir da data de contratação para exercer seu direito de arrependimento e solicitar reembolso total.

Para garantir que o período de arrependimento seja respeitado, **para ferramentas que exijam prazo de carência**, o acesso será liberado apenas a partir do oitavo dia após a data de início da sua assinatura (ou renovação). Para ferramentas configuradas com liberação imediata, o botão de solicitar acesso estará disponível assim que sua assinatura estiver ativa. A configuração (prazo de 8 dias ou liberação imediata) é definida por ferramenta na plataforma.

**IMPORTANTE:** Esta regra de 8 dias, quando aplicável, vale tanto para compras iniciais quanto para renovações. O período de espera é contado a partir da data de início do novo período de assinatura (current_period_start).

**ISENÇÃO DE RESPONSABILIDADE:** Ao contratar qualquer plano de assinatura, você reconhece e aceita expressamente que o acesso às ferramentas que exijam prazo de carência estará disponível apenas a partir do oitavo dia após o início da sua assinatura (ou renovação), e que este período de espera é uma condição essencial do contrato, estabelecida para garantir o cumprimento do período de arrependimento previsto no CDC. Você concorda que não terá direito a qualquer tipo de compensação, reembolso parcial, desconto ou indenização em decorrência deste período de espera, e que esta condição não constitui falha na prestação do serviço ou descumprimento contratual por parte da Gogh Lab.

#### 2.4.3. Processo de Solicitação

- Conforme o plano e a configuração de cada ferramenta, você poderá solicitar acesso às ferramentas através da área de membros (seção Ferramentas)
- A solicitação será processada e o acesso será liberado em até 24 horas após a aprovação, quando aplicável
- Você receberá as credenciais ou links de acesso através da plataforma, podendo ser enviado também link de vídeo tutorial para realização do login quando disponível

#### 2.4.4. Período de Uso

Após a liberação do acesso, você terá o período de uso definido para cada ferramenta (ex.: 30 dias), contados a partir da data de liberação. Este período pode ser independente do ciclo de cobrança da sua assinatura, conforme a política de cada recurso.

#### 2.4.5. Renovação do Acesso

O acesso às ferramentas pode ser renovado mediante nova solicitação, desde que sua assinatura esteja ativa e em dia. Para ferramentas com prazo de 8 dias, será necessário aguardar novamente o oitavo dia do novo período para solicitar um novo acesso.

#### 2.4.6. Responsabilidade pelo Uso

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

A Gogh Lab se esforça para manter a plataforma disponível 24 horas por dia, 7 por semana. No entanto, não garantimos disponibilidade ininterrupta e não nos responsabilizamos por indisponibilidade de serviços de terceiros (Stripe, Google, provedores das ferramentas, etc.).

## 7. Limites de Uso e Fair Use

Os recursos da plataforma devem ser utilizados de forma razoável e dentro dos limites estabelecidos para cada plano. É expressamente proibido compartilhar credenciais de acesso com terceiros, utilizar a plataforma para atividades ilegais ou não autorizadas, ou tentar burlar limites de uso.

## 8. Propriedade Intelectual

Todo o conteúdo da plataforma, incluindo textos, imagens, vídeos, cursos, prompts e demais materiais, é de propriedade exclusiva da Gogh Lab ou de seus licenciadores, protegido por leis de propriedade intelectual.

## 9. Limitação de Responsabilidade

A plataforma é fornecida "como está". A Gogh Lab não se responsabiliza por perdas indiretas, perda de dados ou danos resultantes de falhas técnicas ou indisponibilidade de serviços de terceiros. Em nenhuma hipótese a responsabilidade total da Gogh Lab excederá o valor pago pelo usuário nos últimos 12 meses pela assinatura.

## 10. Proteção de Dados

O tratamento dos seus dados pessoais segue a LGPD. Dados de pagamento são processados exclusivamente pela Stripe (PCI DSS). Consulte a Política de Privacidade para mais informações.

## 11. Modificações nos Termos

A Gogh Lab reserva-se o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas com antecedência mínima de 30 dias. O uso continuado da plataforma após as modificações constitui aceitação dos novos termos.

## 12. Lei Aplicável e Foro

Estes termos são regidos pela legislação brasileira. Qualquer controvérsia será resolvida no foro da comarca de Uberlândia/MG.

## 13. Contato

Para questões relacionadas a assinaturas, pagamentos ou estes termos:

- **E-mail**: contato.goghlab@gmail.com
- **WhatsApp**: [número configurado na plataforma]
- **Portal**: Acesse sua área de membros para gerenciar sua assinatura

**Última atualização**: Janeiro de 2026',
  updated_at = NOW()
WHERE key = 'termos-assinatura-planos';

-- Verificação
SELECT key, title, 
  CASE WHEN content LIKE '%contas novas todos os meses%' THEN 'OK' ELSE 'FALTA' END AS tem_contas_novas,
  CASE WHEN content LIKE '%Canva%' OR content LIKE '%CapCut%' THEN 'AINDA_ESPECIFICO' ELSE 'GENERICO' END AS linguagem
FROM site_terms
WHERE key = 'termos-assinatura-planos';
