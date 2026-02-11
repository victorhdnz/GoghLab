-- ==========================================
-- ATUALIZAR TERMOS DE ASSINATURA E PLANOS COMPLETO
-- ==========================================
-- Este script atualiza o conteúdo completo dos Termos de Assinatura e Planos
-- com a cláusula de isenção e a política de reembolso corrigida
-- ==========================================
-- INSTRUÇÕES: Execute este script no SQL Editor do Supabase Dashboard
-- ==========================================

-- Primeiro, vamos ver o conteúdo atual para confirmar
SELECT 
  key,
  title,
  LENGTH(content) as tamanho_conteudo,
  CASE 
    WHEN content LIKE '%ISENÇÃO DE RESPONSABILIDADE:%' THEN '✓ Tem isenção'
    ELSE '✗ Sem isenção'
  END as status_isencao,
  CASE 
    WHEN content LIKE '%Direito de Arrependimento: Conforme o CDC%' THEN '✓ Reembolso atualizado'
    ELSE '✗ Reembolso desatualizado'
  END as status_reembolso
FROM site_terms
WHERE key = 'termos-assinatura-planos';

-- Agora vamos atualizar o conteúdo completo
-- NOTA: Este UPDATE substitui TODO o conteúdo. Certifique-se de fazer backup se necessário.
UPDATE site_terms
SET 
  content = (
    SELECT content 
    FROM (
      VALUES (
        '# Termos de Assinatura e Planos

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

**ISENÇÃO DE RESPONSABILIDADE:** Ao contratar qualquer plano de assinatura, você reconhece e aceita expressamente que o acesso às ferramentas profissionais (Canva Pro e CapCut Pro) estará disponível apenas a partir do oitavo dia após o início da sua assinatura (ou renovação), e que este período de espera é uma condição essencial do contrato, estabelecida para garantir o cumprimento do período de arrependimento previsto no CDC. Você concorda que não terá direito a qualquer tipo de compensação, reembolso parcial, desconto ou indenização em decorrência deste período de espera, e que esta condição não constitui falha na prestação do serviço ou descumprimento contratual por parte do Gogh Lab.

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

Todo o conteúdo da plataforma, incluindo textos, imagens, vídeos, cursos, agentes de IA, e demais materiais, é de propriedade exclusiva do Gogh Lab ou de seus licenciadores, protegido por leis de propriedade intelectual.

### 8.2. Conteúdo Gerado pelo Usuário

Conteúdo gerado através dos recursos da plataforma (textos, imagens, etc.) é de propriedade do usuário, desde que não viole direitos de terceiros. O Gogh Lab não reivindica propriedade sobre conteúdo gerado pelo usuário.

### 8.3. Uso de Conteúdo

O uso dos recursos da plataforma é pessoal e não transferível. É proibido:

- Reproduzir, distribuir ou comercializar conteúdo da plataforma sem autorização
- Utilizar conteúdo da plataforma para treinar modelos de IA concorrentes
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

**Última atualização**: Janeiro de 2026'
      )
    ) AS t(content)
  ),
  updated_at = NOW()
WHERE key = 'termos-assinatura-planos';

-- Verificar se foi atualizado corretamente
SELECT 
  key,
  title,
  CASE 
    WHEN content LIKE '%ISENÇÃO DE RESPONSABILIDADE:%' THEN '✓ Cláusula de isenção presente'
    ELSE '✗ Cláusula de isenção NÃO encontrada'
  END as status_isencao,
  CASE 
    WHEN content LIKE '%Direito de Arrependimento: Conforme o CDC%' THEN '✓ Política de reembolso atualizada'
    ELSE '✗ Política de reembolso NÃO atualizada'
  END as status_reembolso,
  updated_at
FROM site_terms
WHERE key = 'termos-assinatura-planos';

