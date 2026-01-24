-- ==========================================
-- CRIAR TERMO "Termos de Serviços Personalizados"
-- ==========================================
-- Este script cria o termo de serviços personalizados na tabela site_terms
-- ==========================================
-- INSTRUÇÕES: Execute este script no SQL Editor do Supabase Dashboard
-- ==========================================

INSERT INTO public.site_terms (key, title, content, icon)
VALUES (
  'termos-servicos',
  'Termos de Serviços Personalizados',
  '# Termos de Serviços Personalizados

## 1. Aceitação dos Termos

Ao contratar os serviços personalizados oferecidos pela Gogh Lab, você concorda expressamente com os termos e condições estabelecidos neste documento. A contratação de qualquer serviço implica na aceitação integral e irrestrita de todas as cláusulas aqui dispostas.

## 2. Serviços Disponíveis

A Gogh Lab oferece os seguintes serviços personalizados:

### 2.1. Marketing (Tráfego Pago)
- Criação e gestão de campanhas publicitárias
- Otimização contínua de anúncios
- Relatórios e análises de performance
- Acompanhamento de métricas e resultados

### 2.2. Criação de Sites Completos
- Planejamento e arquitetura do projeto
- Design personalizado e responsivo
- Desenvolvimento completo do site
- Publicação e configuração inicial

### 2.3. Criação de Conteúdo Completa
- Desenvolvimento de roteiros
- Produção de conteúdo (vídeos, imagens, textos)
- Edição e pós-produção completa
- Otimização para diferentes plataformas

### 2.4. Gestão de Redes Sociais
- Criação de calendário editorial
- Postagem e agendamento de conteúdo
- Interação com a audiência
- Monitoramento e relatórios de engajamento

### 2.5. Manutenção e Alteração em Sites Existentes
- Manutenção, correções, e adição em sites existentes
- Atualizações de conteúdo e funcionalidades
- Correção de bugs e problemas técnicos
- Melhorias e otimizações contínuas

## 3. Contratação e Seleção de Serviços

### 3.1. Seleção de Serviços
O cliente pode selecionar quais serviços deseja contratar durante o processo de checkout. Todos os serviços começam selecionados por padrão, mas o cliente pode desmarcar os que não deseja antes de finalizar a contratação.

### 3.2. Preços e Pagamento
- Os preços são calculados dinamicamente com base nos serviços selecionados
- O pagamento pode ser realizado de forma mensal ou anual
- O preço total será exibido antes da confirmação da contratação

## 4. Execução dos Serviços

### 4.1. Prazo de Início
Os serviços contratados terão início após a confirmação do pagamento e serão executados pela equipe da Gogh Lab.

### 4.2. Comunicação
A comunicação entre cliente e equipe será realizada principalmente via WhatsApp, utilizando o número de suporte oficial da Gogh Lab.

### 4.3. Materiais e Informações
O cliente se compromete a fornecer todos os materiais, informações e acessos necessários para a execução dos serviços contratados em tempo hábil.

## 5. Prazos e Entregas

### 5.1. Prazos de Entrega
Os prazos de entrega variam conforme o serviço contratado e serão comunicados ao cliente no momento da contratação ou início do projeto.

### 5.2. Atrasos
Em caso de atraso na entrega, a Gogh Lab se compromete a comunicar o cliente com antecedência e propor soluções alternativas quando possível.

## 6. Custos e Investimentos em Campanhas

### 6.1. Créditos de Tráfego Pago
Para o serviço de Marketing (Tráfego Pago), os créditos utilizados nas campanhas publicitárias serão de responsabilidade do cliente. A Gogh Lab não se responsabiliza pelo pagamento de créditos ou investimentos em plataformas de publicidade (Google Ads, Meta Ads, etc.). O cliente deve fornecer acesso às contas de publicidade e será responsável por todos os custos relacionados aos créditos utilizados nas campanhas.

### 6.2. Gestão e Otimização
A Gogh Lab se responsabiliza pela criação, gestão e otimização das campanhas, mas não pelos custos de créditos publicitários, que são de total responsabilidade do cliente.

## 7. Cancelamento e Reembolso

### 7.1. Cancelamento pelo Cliente
O cliente pode cancelar a assinatura de serviços a qualquer momento, respeitando o período de arrependimento de 7 (sete) dias conforme o Código de Defesa do Consumidor.

### 7.2. Reembolso
Reembolsos serão processados conforme a política de reembolso da Gogh Lab e a legislação vigente, especialmente o Código de Defesa do Consumidor.

### 7.3. Cancelamento pela Gogh Lab
A Gogh Lab se reserva o direito de cancelar serviços em caso de descumprimento contratual pelo cliente ou impossibilidade técnica de execução.

## 8. Propriedade Intelectual

### 8.1. Materiais Criados
Todos os materiais criados pela Gogh Lab durante a execução dos serviços contratados serão de propriedade do cliente após o pagamento integral dos serviços.

### 8.2. Uso de Materiais
O cliente pode utilizar os materiais entregues conforme sua necessidade, respeitando eventuais restrições de uso de terceiros (imagens, músicas, etc.).

## 9. Confidencialidade

A Gogh Lab se compromete a manter a confidencialidade de todas as informações e materiais fornecidos pelo cliente durante a execução dos serviços.

## 10. Limitação de Responsabilidade

A Gogh Lab não se responsabiliza por:
- Resultados específicos de campanhas publicitárias ou estratégias de marketing
- Problemas técnicos de terceiros (plataformas, servidores, etc.)
- Alterações em políticas de plataformas que afetem a execução dos serviços
- Danos indiretos ou lucros cessantes

## 11. Alterações nos Termos

A Gogh Lab se reserva o direito de alterar estes termos a qualquer momento, notificando os clientes através dos canais oficiais de comunicação.

## 12. Contato

Para dúvidas, sugestões ou reclamações sobre os serviços personalizados, entre em contato através do WhatsApp de suporte ou e-mail oficial da Gogh Lab.

---

**Última atualização:** Janeiro de 2026',
  'file-text'
)
ON CONFLICT (key) 
DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  icon = EXCLUDED.icon,
  updated_at = now();
