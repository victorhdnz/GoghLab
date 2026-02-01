-- Adicionar status 'error' em support_tickets (para reportes de problema na conta)
-- Permite que tickets de reporte apareçam como "Erro" no dashboard de solicitações

ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_status_check;
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_status_check
  CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'waiting_response', 'error'));
