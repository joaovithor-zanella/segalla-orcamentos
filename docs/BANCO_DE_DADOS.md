# Documentação do Banco de Dados - Segalla Sistema de Orçamentos

## Visão Geral

O sistema Segalla utiliza **MySQL/MariaDB** para armazenar dados de orçamentos, usuários e configurações, e **Firebird 2.5** para consultar estoque de produtos em tempo real.

## Arquitetura

```
┌─────────────────────────────────────────────┐
│         Segalla Sistema de Orçamentos       │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────┐  ┌────────────────┐  │
│  │  MySQL/MariaDB   │  │   Firebird 2.5 │  │
│  │  (Orçamentos)    │  │   (Estoque)    │  │
│  │  (Usuários)      │  │   (Apenas      │  │
│  │  (Config)        │  │    Leitura)    │  │
│  └──────────────────┘  └────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

## Banco de Dados MySQL

### Tabelas

#### 1. `users`
Armazena informações de usuários do sistema.

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE,
  passwordHash VARCHAR(255),
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  canViewOtherQuotes ENUM('yes', 'no') DEFAULT 'no',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos:**
- `id`: Identificador único
- `openId`: ID único para autenticação local
- `username`: Nome de usuário para login
- `passwordHash`: Hash bcrypt da senha
- `name`: Nome completo do usuário
- `email`: Email do usuário
- `loginMethod`: Método de login (local, oauth, etc)
- `role`: Papel do usuário (admin ou user)
- `canViewOtherQuotes`: Se pode visualizar orçamentos de outros usuários
- `createdAt`: Data de criação
- `updatedAt`: Data da última atualização
- `lastSignedIn`: Data do último login

#### 2. `quotes`
Armazena os orçamentos criados.

```sql
CREATE TABLE quotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  number VARCHAR(50) UNIQUE NOT NULL,
  userId INT NOT NULL,
  customerName VARCHAR(255),
  customerPhone VARCHAR(20),
  observations TEXT,
  paymentMethodId INT,
  status ENUM('draft', 'sent', 'approved', 'rejected') DEFAULT 'draft',
  totalAmount DECIMAL(12, 2),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (paymentMethodId) REFERENCES paymentMethods(id) ON DELETE SET NULL,
  INDEX idx_userId (userId),
  INDEX idx_status (status),
  INDEX idx_createdAt (createdAt)
);
```

**Campos:**
- `id`: Identificador único
- `number`: Número único do orçamento
- `userId`: ID do usuário que criou o orçamento
- `customerName`: Nome do cliente
- `customerPhone`: Telefone do cliente
- `observations`: Observações adicionais
- `paymentMethodId`: ID da forma de pagamento
- `status`: Status do orçamento
- `totalAmount`: Valor total do orçamento
- `createdAt`: Data de criação
- `updatedAt`: Data da última atualização

#### 3. `quoteItems`
Armazena os itens (produtos) de cada orçamento.

```sql
CREATE TABLE quoteItems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quoteId INT NOT NULL,
  productCode VARCHAR(50) NOT NULL,
  productName VARCHAR(255),
  productBrand VARCHAR(100),
  quantity DECIMAL(10, 2) NOT NULL,
  unitPrice DECIMAL(12, 2) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quoteId) REFERENCES quotes(id) ON DELETE CASCADE,
  INDEX idx_quoteId (quoteId),
  INDEX idx_productCode (productCode)
);
```

**Campos:**
- `id`: Identificador único
- `quoteId`: ID do orçamento
- `productCode`: Código do produto (do Firebird)
- `productName`: Nome do produto
- `productBrand`: Marca do produto
- `quantity`: Quantidade solicitada
- `unitPrice`: Preço unitário
- `createdAt`: Data de criação

#### 4. `paymentMethods`
Armazena as formas de pagamento disponíveis.

```sql
CREATE TABLE paymentMethods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_isActive (isActive)
);
```

**Campos:**
- `id`: Identificador único
- `name`: Nome da forma de pagamento
- `description`: Descrição
- `isActive`: Se está ativa
- `createdAt`: Data de criação
- `updatedAt`: Data da última atualização

### Índices

Os índices foram criados para otimizar as queries mais comuns:

```sql
-- Índices em users
CREATE INDEX idx_openId ON users(openId);
CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_role ON users(role);

-- Índices em quotes
CREATE INDEX idx_userId ON quotes(userId);
CREATE INDEX idx_status ON quotes(status);
CREATE INDEX idx_createdAt ON quotes(createdAt);
CREATE INDEX idx_number ON quotes(number);

-- Índices em quoteItems
CREATE INDEX idx_quoteId ON quoteItems(quoteId);
CREATE INDEX idx_productCode ON quoteItems(productCode);

-- Índices em paymentMethods
CREATE INDEX idx_isActive ON paymentMethods(isActive);
```

### Relacionamentos

```
users (1) ──────────── (N) quotes
                           │
                           ├──────── (N) quoteItems
                           │
                           └──────── (1) paymentMethods
```

## Banco de Dados Firebird 2.5

### Tabelas de Origem (Configuráveis)

O sistema consulta 4 tabelas no Firebird para montar o catálogo de produtos:

#### 1. Tabela de Produtos
Contém código e descrição dos produtos.

```
TESTPRODUTOGERAL
├── CODIGO (VARCHAR)
└── DESCRICAO (VARCHAR)
```

#### 2. Tabela de Estoque
Contém código, marca e estoque disponível.

```
TESTEESTOQUE
├── CODIGO (VARCHAR)
├── CODIGO_MARCA (VARCHAR)
├── ESTOQUE (NUMERIC)
└── RESERVADO (BOOLEAN)
```

#### 3. Tabela de Preços
Contém código e valor do produto.

```
TESTPRODUTO
├── CODIGO (VARCHAR)
└── VALOR (NUMERIC)
```

#### 4. Tabela de Marcas
Contém código e nome da marca.

```
TESTMARCA
├── CODIGO (VARCHAR)
└── NOME (VARCHAR)
```

### Query de Consulta

O sistema executa um JOIN entre as 4 tabelas:

```sql
SELECT
  p.CODIGO,
  p.DESCRICAO,
  pr.VALOR,
  e.ESTOQUE,
  m.NOME as MARCA
FROM TESTPRODUTOGERAL p
LEFT JOIN TESTPRODUTO pr ON p.CODIGO = pr.CODIGO
LEFT JOIN TESTEESTOQUE e ON p.CODIGO = e.CODIGO
LEFT JOIN TESTMARCA m ON e.CODIGO_MARCA = m.CODIGO
WHERE e.ESTOQUE > 0 OR e.ESTOQUE IS NULL
ORDER BY p.CODIGO
```

## Scripts SQL

### Schema Principal

O arquivo `database/schema.sql` contém:
- Criação de todas as tabelas
- Definição de chaves primárias
- Definição de chaves estrangeiras
- Criação de índices
- Triggers para auditoria

### Seeds (Dados Iniciais)

O arquivo `database/seeds.sql` contém:
- Usuário admin padrão
- Formas de pagamento padrão
- Dados de exemplo para testes

## Backup e Restauração

### Backup Completo

```bash
# Backup com estrutura e dados
mysqldump -u segalla_user -p segalla_orcamentos > backup.sql

# Backup comprimido
mysqldump -u segalla_user -p segalla_orcamentos | gzip > backup.sql.gz
```

### Restauração

```bash
# Restaurar de arquivo SQL
mysql -u segalla_user -p segalla_orcamentos < backup.sql

# Restaurar de arquivo comprimido
gunzip < backup.sql.gz | mysql -u segalla_user -p segalla_orcamentos
```

### Backup Automático

O script `scripts/backup.sh` realiza backups automáticos:

```bash
# Executar backup
bash scripts/backup.sh

# Listar backups
ls -lh backups/

# Restaurar backup
bash scripts/restore.sh backups/backup_2024-01-15_10-30-00.sql
```

## Migração de Dados

### Do Firebird para MySQL

Se precisar migrar dados do Firebird para MySQL:

```bash
# 1. Exportar dados do Firebird
# Usar ferramenta de exportação do Firebird

# 2. Converter para SQL MySQL
# Ajustar tipos de dados e sintaxe

# 3. Importar no MySQL
mysql -u segalla_user -p segalla_orcamentos < dados_convertidos.sql
```

## Manutenção

### Verificar Integridade

```bash
# Verificar tabelas
mysqlcheck -u segalla_user -p segalla_orcamentos --all-databases

# Reparar tabelas (se necessário)
mysqlcheck -u segalla_user -p segalla_orcamentos --repair --all-databases
```

### Otimizar Tabelas

```bash
# Otimizar todas as tabelas
mysqlcheck -u segalla_user -p segalla_orcamentos --optimize --all-databases

# Ou individual
OPTIMIZE TABLE users, quotes, quoteItems, paymentMethods;
```

### Monitorar Performance

```bash
# Ver queries lentas
SHOW PROCESSLIST;

# Ver variáveis de performance
SHOW STATUS LIKE 'Threads%';
SHOW STATUS LIKE 'Questions';
```

## Segurança

### Permissões de Usuário

O usuário `segalla_user` tem permissões apenas na database `segalla_orcamentos`:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP 
ON segalla_orcamentos.* 
TO 'segalla_user'@'localhost';
```

### Proteção de Dados

- Senhas são armazenadas com hash bcrypt
- Tokens JWT com expiração
- Isolamento de dados por usuário
- Auditoria de alterações

## Próximos Passos

1. Consulte `docs/INSTALACAO.md` para instalar o sistema
2. Leia `docs/CONFIGURACAO.md` para configurar variáveis
3. Veja `docs/API.md` para documentação da API
4. Consulte `docs/DEPLOY.md` para deploy em produção
