-- ============================================================
-- SEGALLA - SISTEMA DE ORÇAMENTOS
-- Schema do Banco de Dados MySQL 8.0+
-- ============================================================
-- Este arquivo contém a estrutura completa do banco de dados
-- Execute este arquivo para criar todas as tabelas do zero

-- ─── CRIAÇÃO DO BANCO DE DADOS ─────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS segalla_orcamentos 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE segalla_orcamentos;

-- ─── TABELA: USUÁRIOS ──────────────────────────────────────────────────────
-- Campos: id, openId, username, passwordHash, name, email, loginMethod, role, canViewOtherQuotes, active
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `openId` VARCHAR(64) UNIQUE COMMENT 'ID único para autenticação',
  `username` VARCHAR(100) UNIQUE COMMENT 'Nome de usuário para login',
  `passwordHash` VARCHAR(255) COMMENT 'Hash bcrypt da senha',
  `name` TEXT COMMENT 'Nome completo do usuário',
  `email` VARCHAR(320) COMMENT 'Email do usuário',
  `loginMethod` VARCHAR(64) COMMENT 'Método de login (local, oauth, etc)',
  `role` ENUM('user', 'admin') DEFAULT 'user' NOT NULL COMMENT 'Papel do usuário',
  `canViewOtherQuotes` ENUM('yes', 'no') DEFAULT 'no' NOT NULL COMMENT 'Pode visualizar orçamentos de outros usuários',
  `active` ENUM('yes', 'no') DEFAULT 'yes' NOT NULL COMMENT 'Se o usuário está ativo',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data da última atualização',
  `lastSignedIn` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data do último login',
  
  INDEX `idx_openId` (`openId`),
  INDEX `idx_username` (`username`),
  INDEX `idx_role` (`role`),
  INDEX `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Usuários do sistema';

-- ─── TABELA: FORMAS DE PAGAMENTO ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `payment_methods` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL UNIQUE COMMENT 'Nome da forma de pagamento',
  `description` TEXT COMMENT 'Descrição',
  `active` ENUM('yes', 'no') DEFAULT 'yes' NOT NULL COMMENT 'Se está ativa',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data da última atualização',
  
  INDEX `idx_active` (`active`),
  INDEX `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Formas de pagamento disponíveis';

-- ─── TABELA: ORÇAMENTOS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `quotes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `number` VARCHAR(20) UNIQUE NOT NULL COMMENT 'Número único do orçamento',
  `userId` INT NOT NULL COMMENT 'ID do usuário que criou',
  `customerName` VARCHAR(200) COMMENT 'Nome do cliente',
  `customerPhone` VARCHAR(30) COMMENT 'Telefone do cliente',
  `paymentMethodId` INT COMMENT 'ID da forma de pagamento',
  `observations` TEXT COMMENT 'Observações adicionais',
  `status` ENUM('draft', 'sent', 'approved', 'rejected') DEFAULT 'draft' NOT NULL COMMENT 'Status do orçamento',
  `totalAmount` DECIMAL(12, 2) DEFAULT '0.00' COMMENT 'Valor total do orçamento',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data da última atualização',
  
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`paymentMethodId`) REFERENCES `payment_methods`(`id`) ON DELETE SET NULL,
  
  INDEX `idx_userId` (`userId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_createdAt` (`createdAt`),
  INDEX `idx_number` (`number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Orçamentos criados';

-- ─── TABELA: ITENS DE ORÇAMENTOS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `quote_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quoteId` INT NOT NULL COMMENT 'ID do orçamento',
  `productCode` VARCHAR(60) NOT NULL COMMENT 'Código do produto (do Firebird)',
  `productName` VARCHAR(300) NOT NULL COMMENT 'Nome do produto',
  `productBrand` VARCHAR(120) COMMENT 'Marca do produto',
  `quantity` DECIMAL(10, 2) NOT NULL DEFAULT '1.00' COMMENT 'Quantidade solicitada',
  `unitPrice` DECIMAL(12, 2) NOT NULL DEFAULT '0.00' COMMENT 'Preço unitário',
  `totalPrice` DECIMAL(12, 2) NOT NULL DEFAULT '0.00' COMMENT 'Preço total (quantity * unitPrice)',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
  
  FOREIGN KEY (`quoteId`) REFERENCES `quotes`(`id`) ON DELETE CASCADE,
  
  INDEX `idx_quoteId` (`quoteId`),
  INDEX `idx_productCode` (`productCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Itens de cada orçamento';

-- ─── ÍNDICES ADICIONAIS PARA PERFORMANCE ──────────────────────────────────
CREATE INDEX `idx_quotes_userId_status` ON `quotes`(`userId`, `status`);
CREATE INDEX `idx_quotes_createdAt_status` ON `quotes`(`createdAt`, `status`);
CREATE INDEX `idx_quoteItems_quoteId_productCode` ON `quote_items`(`quoteId`, `productCode`);

-- ─── VIEWS ÚTEIS ──────────────────────────────────────────────────────────
-- View: Orçamentos com informações do usuário
CREATE OR REPLACE VIEW `vw_quotes_with_user` AS
SELECT 
  q.`id`,
  q.`number`,
  q.`customerName`,
  q.`customerPhone`,
  q.`status`,
  q.`totalAmount`,
  q.`createdAt`,
  q.`updatedAt`,
  u.`name` AS `userName`,
  u.`email` AS `userEmail`,
  pm.`name` AS `paymentMethodName`
FROM `quotes` q
LEFT JOIN `users` u ON q.`userId` = u.`id`
LEFT JOIN `payment_methods` pm ON q.`paymentMethodId` = pm.`id`;

-- View: Itens de orçamento com cálculo de total
CREATE OR REPLACE VIEW `vw_quote_items_with_total` AS
SELECT 
  qi.`id`,
  qi.`quoteId`,
  qi.`productCode`,
  qi.`productName`,
  qi.`productBrand`,
  qi.`quantity`,
  qi.`unitPrice`,
  (qi.`quantity` * qi.`unitPrice`) AS `totalPrice`
FROM `quote_items` qi;

-- ─── TRIGGERS PARA AUDITORIA ──────────────────────────────────────────────
-- Trigger: Atualizar totalAmount quando adicionar itens
DELIMITER $$

CREATE TRIGGER `trg_update_quote_total_after_insert`
AFTER INSERT ON `quote_items`
FOR EACH ROW
BEGIN
  UPDATE `quotes` 
  SET `totalAmount` = (
    SELECT SUM(`quantity` * `unitPrice`) 
    FROM `quote_items` 
    WHERE `quoteId` = NEW.`quoteId`
  )
  WHERE `id` = NEW.`quoteId`;
END$$

-- Trigger: Atualizar totalAmount quando editar itens
CREATE TRIGGER `trg_update_quote_total_after_update`
AFTER UPDATE ON `quote_items`
FOR EACH ROW
BEGIN
  UPDATE `quotes` 
  SET `totalAmount` = (
    SELECT SUM(`quantity` * `unitPrice`) 
    FROM `quote_items` 
    WHERE `quoteId` = NEW.`quoteId`
  )
  WHERE `id` = NEW.`quoteId`;
END$$

-- Trigger: Atualizar totalAmount quando deletar itens
CREATE TRIGGER `trg_update_quote_total_after_delete`
AFTER DELETE ON `quote_items`
FOR EACH ROW
BEGIN
  UPDATE `quotes` 
  SET `totalAmount` = (
    SELECT SUM(`quantity` * `unitPrice`) 
    FROM `quote_items` 
    WHERE `quoteId` = OLD.`quoteId`
  )
  WHERE `id` = OLD.`quoteId`;
END$$

DELIMITER ;

-- ─── DADOS INICIAIS ───────────────────────────────────────────────────────
-- Usuário admin pré-criado para acesso inicial
-- Username: admin
-- Senha: @Segalla2025
-- Hash PBKDF2: a593f57b90ef30c32b7c595aab72ceda:6c07c9ec9b9c4fce460d3ba317ef1108996d20635854a77c61cfd579529a3d1b6ebe2783f20bce4e93d4339fb1a83d7a5e3b6fe7a0557fcae5a450abba83ac91

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

-- ─── COMENTÁRIOS FINAIS ───────────────────────────────────────────────────
-- Este schema foi gerado automaticamente pelo sistema Segalla
-- Data: 2024-01-15
-- Versão: 1.0.0
-- 
-- Para restaurar este banco de dados:
-- mysql -u root < database/schema.sql
-- 
-- Para importar dados iniciais (com admin pré-criado):
-- mysql -u root segalla_orcamentos < database/seeds.sql
