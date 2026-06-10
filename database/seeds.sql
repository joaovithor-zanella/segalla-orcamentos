-- ============================================================
-- SEGALLA - SISTEMA DE ORÇAMENTOS
-- Dados Iniciais (Seeds)
-- ============================================================
-- Este arquivo contém os dados iniciais para o sistema
-- Inclui: usuário admin, formas de pagamento padrão

USE segalla_orcamentos;

-- ─── USUÁRIO ADMIN ────────────────────────────────────────────────────────
-- Username: admin
-- Senha: @Segalla2025
-- Hash PBKDF2 gerado com: node -e "const crypto = require('crypto'); const salt = crypto.randomBytes(16).toString('hex'); const hash = crypto.pbkdf2Sync('@Segalla2025', salt, 1000, 64, 'sha512').toString('hex'); console.log(salt + ':' + hash)"

INSERT INTO `users` (
  `openId`,
  `username`,
  `passwordHash`,
  `name`,
  `email`,
  `loginMethod`,
  `role`,
  `canViewOtherQuotes`,
  `active`,
  `createdAt`,
  `updatedAt`,
  `lastSignedIn`
) VALUES (
  'local-admin-segalla',
  'admin',
  'a593f57b90ef30c32b7c595aab72ceda:6c07c9ec9b9c4fce460d3ba317ef1108996d20635854a77c61cfd579529a3d1b6ebe2783f20bce4e93d4339fb1a83d7a5e3b6fe7a0557fcae5a450abba83ac91',
  'Administrador',
  'admin@segalla.com.br',
  'local',
  'admin',
  'yes',
  'yes',
  NOW(),
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE 
  `passwordHash` = 'a593f57b90ef30c32b7c595aab72ceda:6c07c9ec9b9c4fce460d3ba317ef1108996d20635854a77c61cfd579529a3d1b6ebe2783f20bce4e93d4339fb1a83d7a5e3b6fe7a0557fcae5a450abba83ac91',
  `updatedAt` = NOW();

-- ─── FORMAS DE PAGAMENTO PADRÃO ───────────────────────────────────────────
INSERT INTO `payment_methods` (`name`, `description`, `active`) VALUES
('À Vista', 'Pagamento à vista em dinheiro ou transferência', 'yes'),
('Boleto 7 dias', 'Boleto com vencimento em 7 dias', 'yes'),
('Boleto 15 dias', 'Boleto com vencimento em 15 dias', 'yes'),
('Boleto 30 dias', 'Boleto com vencimento em 30 dias', 'yes'),
('Cartão de Crédito', 'Pagamento via cartão de crédito', 'yes'),
('Cartão de Débito', 'Pagamento via cartão de débito', 'yes'),
('Crediário', 'Parcelado em até 12x', 'yes'),
('Transferência Bancária', 'Transferência para conta da empresa', 'yes'),
('Cheque', 'Pagamento via cheque', 'no'),
('Consignação', 'Consignação de mercadoria', 'yes')
ON DUPLICATE KEY UPDATE `active` = VALUES(`active`);

-- ─── COMENTÁRIOS FINAIS ───────────────────────────────────────────────────
-- Dados iniciais carregados com sucesso!
-- 
-- Usuário admin criado:
-- - Username: admin
-- - Senha: @Segalla2025
-- - Role: admin (acesso total)
-- - canViewOtherQuotes: yes (pode ver todos os orçamentos)
--
-- Formas de pagamento padrão criadas:
-- - À Vista
-- - Boleto (7, 15, 30 dias)
-- - Cartão (Crédito e Débito)
-- - Crediário
-- - Transferência Bancária
-- - Cheque (desativado)
-- - Consignação
--
-- Para adicionar mais usuários, use o painel de administração do sistema
-- ou execute INSERT direto nesta tabela com o hash PBKDF2 da senha
--
-- Para gerar novo hash PBKDF2 de senha, use:
-- node -e "const crypto = require('crypto'); const salt = crypto.randomBytes(16).toString('hex'); const hash = crypto.pbkdf2Sync('sua_senha_aqui', salt, 1000, 64, 'sha512').toString('hex'); console.log(salt + ':' + hash)"
