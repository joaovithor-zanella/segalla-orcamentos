# Manual de Instalação - Segalla Sistema de Orçamentos

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** versão 18 ou superior
- **pnpm** ou **npm** para gerenciar dependências
- **MySQL 8.0+** ou **MariaDB 10.5+** para o banco de dados
- **Firebird** (opcional, apenas se você vai usar integração com ERP Firebird)

## 1. Instalação do Sistema

### 1.1 Clonar o Repositório

```bash
git clone <seu-repositorio>
cd segalla-orcamentos
```

### 1.2 Instalar Dependências

```bash
pnpm install
```

### 1.3 Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Banco de Dados MySQL
DATABASE_URL="mysql://usuario:senha@localhost:3306/segalla_orcamentos"

# Autenticação
JWT_SECRET="sua-chave-secreta-aqui-minimo-32-caracteres"

# OAuth (se usar)
VITE_APP_ID="seu-app-id"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://portal.manus.im"

# Firebird (se usar integração com ERP)
FIREBIRD_HOST="localhost"
FIREBIRD_PORT="3050"
FIREBIRD_DATABASE="/path/to/database.fdb"
FIREBIRD_USER="usuario"
FIREBIRD_PASSWORD="senha"

# APIs Manus (se usar)
BUILT_IN_FORGE_API_URL="https://api.manus.im"
BUILT_IN_FORGE_API_KEY="sua-chave-api"
VITE_FRONTEND_FORGE_API_KEY="sua-chave-frontend"
VITE_FRONTEND_FORGE_API_URL="https://api.manus.im"

# Informações do Proprietário
OWNER_NAME="Nome do Proprietário"
OWNER_OPEN_ID="seu-open-id"
```

## 2. Criação do Banco de Dados

### 2.1 Criar Banco de Dados

```sql
CREATE DATABASE IF NOT EXISTS segalla_orcamentos 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE segalla_orcamentos;
```

### 2.2 Criar Tabelas

Execute os comandos SQL abaixo para criar todas as tabelas necessárias:

#### Tabela: users (Usuários do Sistema)

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) UNIQUE,
  username VARCHAR(100) UNIQUE,
  passwordHash VARCHAR(255),
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  canViewOtherQuotes ENUM('yes', 'no') NOT NULL DEFAULT 'no',
  active ENUM('yes', 'no') NOT NULL DEFAULT 'yes',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_openId (openId),
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Tabela: payment_methods (Formas de Pagamento)

```sql
CREATE TABLE IF NOT EXISTS payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  active ENUM('yes', 'no') NOT NULL DEFAULT 'yes',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Tabela: quotes (Orçamentos)

```sql
CREATE TABLE IF NOT EXISTS quotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  number VARCHAR(20) NOT NULL UNIQUE,
  userId INT NOT NULL,
  customerName VARCHAR(200),
  customerPhone VARCHAR(30),
  paymentMethodId INT,
  observations TEXT,
  status ENUM('draft', 'sent', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
  totalAmount DECIMAL(12, 2) DEFAULT 0.00,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (paymentMethodId) REFERENCES payment_methods(id) ON DELETE SET NULL,
  INDEX idx_userId (userId),
  INDEX idx_status (status),
  INDEX idx_number (number),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Tabela: quote_items (Itens dos Orçamentos)

```sql
CREATE TABLE IF NOT EXISTS quote_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quoteId INT NOT NULL,
  productCode VARCHAR(60) NOT NULL,
  productName VARCHAR(300) NOT NULL,
  productBrand VARCHAR(120),
  company VARCHAR(100),
  companyId INT,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  unitPrice DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  totalPrice DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (quoteId) REFERENCES quotes(id) ON DELETE CASCADE,
  INDEX idx_quoteId (quoteId),
  INDEX idx_productCode (productCode),
  INDEX idx_company (company),
  INDEX idx_companyId (companyId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Tabela: vehicle_info (Informações de Veículos)

```sql
CREATE TABLE IF NOT EXISTS vehicle_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quoteId INT UNIQUE,
  plate VARCHAR(20),
  model VARCHAR(100),
  year INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (quoteId) REFERENCES quotes(id) ON DELETE CASCADE,
  INDEX idx_quoteId (quoteId),
  INDEX idx_plate (plate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.3 Script Completo para Criação de Todas as Tabelas

Se preferir, execute este script completo de uma vez:

```sql
-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS segalla_orcamentos 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE segalla_orcamentos;

-- Tabela: users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) UNIQUE,
  username VARCHAR(100) UNIQUE,
  passwordHash VARCHAR(255),
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  canViewOtherQuotes ENUM('yes', 'no') NOT NULL DEFAULT 'no',
  active ENUM('yes', 'no') NOT NULL DEFAULT 'yes',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_openId (openId),
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: payment_methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  active ENUM('yes', 'no') NOT NULL DEFAULT 'yes',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: quotes
CREATE TABLE IF NOT EXISTS quotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  number VARCHAR(20) NOT NULL UNIQUE,
  userId INT NOT NULL,
  customerName VARCHAR(200),
  customerPhone VARCHAR(30),
  paymentMethodId INT,
  observations TEXT,
  status ENUM('draft', 'sent', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
  totalAmount DECIMAL(12, 2) DEFAULT 0.00,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (paymentMethodId) REFERENCES payment_methods(id) ON DELETE SET NULL,
  INDEX idx_userId (userId),
  INDEX idx_status (status),
  INDEX idx_number (number),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: quote_items
CREATE TABLE IF NOT EXISTS quote_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quoteId INT NOT NULL,
  productCode VARCHAR(60) NOT NULL,
  productName VARCHAR(300) NOT NULL,
  productBrand VARCHAR(120),
  company VARCHAR(100),
  companyId INT,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  unitPrice DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  totalPrice DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (quoteId) REFERENCES quotes(id) ON DELETE CASCADE,
  INDEX idx_quoteId (quoteId),
  INDEX idx_productCode (productCode),
  INDEX idx_company (company),
  INDEX idx_companyId (companyId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: vehicle_info
CREATE TABLE IF NOT EXISTS vehicle_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quoteId INT UNIQUE,
  plate VARCHAR(20),
  model VARCHAR(100),
  year INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (quoteId) REFERENCES quotes(id) ON DELETE CASCADE,
  INDEX idx_quoteId (quoteId),
  INDEX idx_plate (plate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 3. Executar Migrações do Drizzle

Após criar o banco de dados, execute as migrações do Drizzle:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## 4. Iniciar o Servidor de Desenvolvimento

```bash
pnpm dev
```

O servidor estará disponível em `http://localhost:3000`

## 5. Criar Usuário Administrador (Opcional)

Se você está usando autenticação local, você pode criar um usuário administrador diretamente no banco de dados:

```sql
-- Criar usuário admin (senha: admin123)
INSERT INTO users (username, passwordHash, name, email, loginMethod, role, active)
VALUES (
  'admin',
  '$2b$10$...',  -- Hash bcrypt da senha 'admin123'
  'Administrador',
  'admin@segalla.com.br',
  'local',
  'admin',
  'yes'
);
```

Para gerar o hash bcrypt, você pode usar:

```bash
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('admin123', 10));"
```

## 6. Verificação de Integridade do Banco de Dados

Para verificar se todas as tabelas foram criadas corretamente, execute:

```bash
pnpm run check-db
```

Este comando verifica:
- Existência de todas as tabelas
- Integridade das foreign keys
- Índices necessários
- Tipos de dados corretos

## 7. Integração com Firebird (ERP)

Se você vai usar a integração com Firebird, configure as variáveis de ambiente:

```env
FIREBIRD_HOST="seu-host-firebird"
FIREBIRD_PORT="3050"
FIREBIRD_DATABASE="/path/to/database.fdb"
FIREBIRD_USER="usuario"
FIREBIRD_PASSWORD="senha"
```

Depois teste a conexão:

```bash
curl http://localhost:3000/api/trpc/products.testConnection
```

## 8. Troubleshooting

### Erro: "Table 'segalla_orcamentos.users' doesn't exist"

**Solução:** Execute os comandos SQL de criação de tabelas novamente. Certifique-se de que o banco de dados foi criado corretamente.

### Erro: "Connection refused"

**Solução:** Verifique se o MySQL está rodando e se as credenciais em `DATABASE_URL` estão corretas.

### Erro: "Foreign key constraint fails"

**Solução:** Certifique-se de que todas as tabelas foram criadas na ordem correta (users → payment_methods → quotes → quote_items, vehicle_info).

## 9. Próximas Etapas

1. Configurar as formas de pagamento através da interface administrativa
2. Integrar com o banco de dados Firebird do seu ERP
3. Configurar usuários e permissões
4. Fazer backup regular do banco de dados

## Suporte

Para mais informações ou reportar problemas, entre em contato com o time de desenvolvimento.
