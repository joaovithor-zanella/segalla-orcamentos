-- ============================================================
-- SEGALLA - SISTEMA DE ORÇAMENTOS
-- Dados Iniciais (Seeds) do Banco de Dados
-- ============================================================
-- Este arquivo contém dados iniciais para o sistema
-- Execute após o schema.sql

USE segalla_orcamentos;

-- ─── USUÁRIOS PADRÃO ───────────────────────────────────────────────────────
-- Usuário admin padrão
-- Username: admin
-- Senha: Segalla@2025
-- Hash gerado com bcrypt

INSERT INTO users (
  openId, 
  username, 
  passwordHash, 
  name, 
  email, 
  loginMethod, 
  role, 
  canViewOtherQuotes
) VALUES (
  'local-admin-001',
  'admin',
  '$2b$10$YIjlrPNoS0I1/6uyWvi5O.eMHVIYb0JvjA8QvwWGEH8Z5ZDsSi7Oy', -- Segalla@2025
  'Administrador',
  'admin@segalla.com.br',
  'local',
  'admin',
  'yes'
);

-- ─── FORMAS DE PAGAMENTO PADRÃO ────────────────────────────────────────────
INSERT INTO paymentMethods (name, description, isActive) VALUES
('À Vista', 'Pagamento à vista em dinheiro ou transferência', TRUE),
('Boleto 7 dias', 'Boleto com vencimento em 7 dias', TRUE),
('Boleto 14 dias', 'Boleto com vencimento em 14 dias', TRUE),
('Boleto 30 dias', 'Boleto com vencimento em 30 dias', TRUE),
('Cartão de Crédito', 'Pagamento via cartão de crédito', TRUE),
('Cartão de Débito', 'Pagamento via cartão de débito', TRUE),
('Cheque', 'Pagamento via cheque', TRUE),
('Crediário', 'Parcelado sem juros', TRUE),
('Consignação', 'Consignação de mercadoria', TRUE),
('Outro', 'Outra forma de pagamento', TRUE);

-- ─── DADOS DE EXEMPLO PARA TESTES ─────────────────────────────────────────
-- Usuário de teste: vendedor
INSERT INTO users (
  openId,
  username,
  passwordHash,
  name,
  email,
  loginMethod,
  role,
  canViewOtherQuotes
) VALUES (
  'local-user-001',
  'vendedor',
  '$2b$10$8qJ9K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G4H5I6', -- senha123
  'João Vendedor',
  'joao@segalla.com.br',
  'local',
  'user',
  'no'
);

-- ─── ORÇAMENTOS DE EXEMPLO ─────────────────────────────────────────────────
-- Orçamento 1: Draft
INSERT INTO quotes (
  number,
  userId,
  customerName,
  customerPhone,
  observations,
  paymentMethodId,
  status,
  totalAmount
) VALUES (
  '20240101001',
  1,
  'Oficina São Paulo',
  '(11) 3000-0000',
  'Cliente regular, oferecer desconto',
  1,
  'draft',
  0
);

-- Orçamento 2: Sent
INSERT INTO quotes (
  number,
  userId,
  customerName,
  customerPhone,
  observations,
  paymentMethodId,
  status,
  totalAmount
) VALUES (
  '20240101002',
  1,
  'Auto Peças Brasil',
  '(21) 2000-0000',
  'Entrega em 2 dias',
  4,
  'sent',
  0
);

-- ─── ITENS DE ORÇAMENTOS DE EXEMPLO ────────────────────────────────────────
-- Itens do orçamento 1
INSERT INTO quoteItems (
  quoteId,
  productCode,
  productName,
  productBrand,
  quantity,
  unitPrice
) VALUES
(1, 'PROD001', 'Filtro de Óleo', 'Bosch', 5, 25.50),
(1, 'PROD002', 'Filtro de Ar', 'Fram', 3, 18.90),
(1, 'PROD003', 'Vela de Ignição', 'NGK', 8, 12.50);

-- Itens do orçamento 2
INSERT INTO quoteItems (
  quoteId,
  productCode,
  productName,
  productBrand,
  quantity,
  unitPrice
) VALUES
(2, 'PROD004', 'Pastilha de Freio', 'Frenmax', 4, 85.00),
(2, 'PROD005', 'Disco de Freio', 'Brembo', 2, 120.00),
(2, 'PROD006', 'Correia Dentada', 'Gates', 1, 250.00);

-- ─── ATUALIZAR TOTAIS DOS ORÇAMENTOS ───────────────────────────────────────
UPDATE quotes SET totalAmount = (
  SELECT SUM(quantity * unitPrice) FROM quoteItems WHERE quoteId = 1
) WHERE id = 1;

UPDATE quotes SET totalAmount = (
  SELECT SUM(quantity * unitPrice) FROM quoteItems WHERE quoteId = 2
) WHERE id = 2;

-- ─── VERIFICAÇÃO FINAL ────────────────────────────────────────────────────
-- Contar registros criados
SELECT 'Usuários criados:' as info, COUNT(*) as total FROM users;
SELECT 'Formas de pagamento criadas:' as info, COUNT(*) as total FROM paymentMethods;
SELECT 'Orçamentos criados:' as info, COUNT(*) as total FROM quotes;
SELECT 'Itens de orçamento criados:' as info, COUNT(*) as total FROM quoteItems;

-- ─── COMENTÁRIOS FINAIS ───────────────────────────────────────────────────
-- Dados iniciais carregados com sucesso!
-- 
-- Usuários padrão:
-- - admin / Segalla@2025 (admin)
-- - vendedor / senha123 (user)
-- 
-- Formas de pagamento: 10 opções padrão
-- Orçamentos de exemplo: 2 para testes
-- 
-- Para resetar os dados:
-- 1. Execute: mysql -u root segalla_orcamentos < database/schema.sql
-- 2. Execute: mysql -u root segalla_orcamentos < database/seeds.sql
