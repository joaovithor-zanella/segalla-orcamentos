# Guia de Configuração - Segalla Sistema de Orçamentos

## Visão Geral

Este documento descreve todas as variáveis de ambiente e configurações disponíveis no sistema Segalla.

## Variáveis de Ambiente

### Servidor

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `NODE_ENV` | string | `production` | Ambiente de execução: `development` ou `production` |
| `PORT` | number | `3000` | Porta em que o servidor será executado |
| `DEBUG` | boolean | `false` | Ativar modo debug com logs detalhados |

### Banco de Dados Principal (MySQL/MariaDB)

| Variável | Tipo | Obrigatória | Descrição |
|----------|------|-------------|-----------|
| `DATABASE_URL` | string | Sim | URL de conexão com MySQL: `mysql://user:pass@host:port/database` |

**Exemplo:**
```
DATABASE_URL=mysql://segalla_user:senha_segura@localhost:3306/segalla_orcamentos
```

### Firebird 2.5 (Estoque de Produtos)

#### Conexão

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `FIREBIRD_HOST` | string | `localhost` | IP ou hostname do servidor Firebird |
| `FIREBIRD_PORT` | number | `3050` | Porta do servidor Firebird |
| `FIREBIRD_DATABASE` | string | - | Caminho completo do arquivo `.fdb` |
| `FIREBIRD_USER` | string | `SYSDBA` | Usuário do Firebird |
| `FIREBIRD_PASSWORD` | string | - | Senha do Firebird |
| `FIREBIRD_CHARSET` | string | `WIN1252` | Charset: `UTF8`, `WIN1252`, `ISO8859_1` |

**Exemplo:**
```
FIREBIRD_HOST=192.168.1.100
FIREBIRD_PORT=3050
FIREBIRD_DATABASE=/dados/estoque.fdb
FIREBIRD_USER=SYSDBA
FIREBIRD_PASSWORD=masterkey
FIREBIRD_CHARSET=WIN1252
```

#### Tabelas

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `FIREBIRD_TABLE_PRODUCTS` | string | Tabela com código e descrição dos produtos |
| `FIREBIRD_TABLE_STOCK` | string | Tabela com estoque disponível |
| `FIREBIRD_TABLE_PRICES` | string | Tabela com preços dos produtos |
| `FIREBIRD_TABLE_BRANDS` | string | Tabela com marcas dos produtos |

**Exemplo:**
```
FIREBIRD_TABLE_PRODUCTS=TESTPRODUTOGERAL
FIREBIRD_TABLE_STOCK=TESTEESTOQUE
FIREBIRD_TABLE_PRICES=TESTPRODUTO
FIREBIRD_TABLE_BRANDS=TESTMARCA
```

#### Campos das Tabelas

| Variável | Tabela | Descrição |
|----------|--------|-----------|
| `FIREBIRD_FIELD_PRODUCT_CODE` | PRODUCTS | Campo do código do produto |
| `FIREBIRD_FIELD_PRODUCT_NAME` | PRODUCTS | Campo da descrição do produto |
| `FIREBIRD_FIELD_STOCK_CODE` | STOCK | Campo do código do produto |
| `FIREBIRD_FIELD_STOCK_BRAND_CODE` | STOCK | Campo do código da marca |
| `FIREBIRD_FIELD_STOCK_QUANTITY` | STOCK | Campo da quantidade em estoque |
| `FIREBIRD_FIELD_PRICE_CODE` | PRICES | Campo do código do produto |
| `FIREBIRD_FIELD_PRICE_VALUE` | PRICES | Campo do valor/preço |
| `FIREBIRD_FIELD_BRAND_CODE` | BRANDS | Campo do código da marca |
| `FIREBIRD_FIELD_BRAND_NAME` | BRANDS | Campo do nome da marca |

**Exemplo:**
```
FIREBIRD_FIELD_PRODUCT_CODE=CODIGO
FIREBIRD_FIELD_PRODUCT_NAME=DESCRICAO
FIREBIRD_FIELD_STOCK_CODE=CODIGO
FIREBIRD_FIELD_STOCK_BRAND_CODE=CODIGO_MARCA
FIREBIRD_FIELD_STOCK_QUANTITY=ESTOQUE
FIREBIRD_FIELD_PRICE_CODE=CODIGO
FIREBIRD_FIELD_PRICE_VALUE=VALOR
FIREBIRD_FIELD_BRAND_CODE=CODIGO
FIREBIRD_FIELD_BRAND_NAME=NOME
```

### Autenticação

| Variável | Tipo | Obrigatória | Descrição |
|----------|------|-------------|-----------|
| `JWT_SECRET` | string | Sim | Chave secreta para assinatura de tokens JWT (mínimo 32 caracteres) |

**Exemplo:**
```
JWT_SECRET=sua_chave_secreta_muito_segura_aqui_com_minimo_32_caracteres_aleatorios
```

**Como gerar uma chave segura:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Informações da Empresa

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `COMPANY_NAME` | string | `Segalla Peças Automotivas` | Nome da empresa (aparece nos orçamentos) |
| `COMPANY_TAGLINE` | string | - | Slogan/tagline da empresa |
| `COMPANY_PHONE` | string | - | Telefone da empresa (opcional) |
| `COMPANY_EMAIL` | string | - | Email da empresa (opcional) |
| `COMPANY_ADDRESS` | string | - | Endereço da empresa (opcional) |

**Exemplo:**
```
COMPANY_NAME=Segalla Peças Automotivas
COMPANY_TAGLINE=Qualidade e confiança para sua oficina
COMPANY_PHONE=(11) 3000-0000
COMPANY_EMAIL=contato@segalla.com.br
COMPANY_ADDRESS=Rua das Peças, 123 - São Paulo/SP
```

### Segurança

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `SESSION_TIMEOUT` | number | `480` | Tempo de expiração da sessão em minutos |
| `MAX_LOGIN_ATTEMPTS` | number | `5` | Número máximo de tentativas de login falhadas |
| `LOGIN_BLOCK_TIME` | number | `15` | Tempo de bloqueio após tentativas falhadas (minutos) |

**Exemplo:**
```
SESSION_TIMEOUT=480        # 8 horas
MAX_LOGIN_ATTEMPTS=5       # 5 tentativas
LOGIN_BLOCK_TIME=15        # 15 minutos de bloqueio
```

### Logs

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `LOG_LEVEL` | string | `info` | Nível de log: `debug`, `info`, `warn`, `error` |
| `LOG_FILE` | string | `./logs/app.log` | Arquivo de log da aplicação |
| `ERROR_LOG_FILE` | string | `./logs/error.log` | Arquivo de log de erros |

**Exemplo:**
```
LOG_LEVEL=info
LOG_FILE=./logs/app.log
ERROR_LOG_FILE=./logs/error.log
```

### Backup

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `BACKUP_DIR` | string | `./backups` | Diretório para armazenar backups |
| `BACKUP_FREQUENCY` | number | `24` | Frequência de backup automático em horas |
| `MAX_BACKUPS` | number | `7` | Número máximo de backups a manter |

**Exemplo:**
```
BACKUP_DIR=./backups
BACKUP_FREQUENCY=24        # Diário
MAX_BACKUPS=7              # Manter últimos 7 backups
```

### CORS

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `CORS_ORIGINS` | string | `http://localhost:3000` | Origens permitidas (separadas por vírgula) |

**Exemplo:**
```
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://segalla.com.br
```

## Configurações Avançadas

### Modo Desenvolvimento

Para desenvolvimento local, configure:

```bash
NODE_ENV=development
PORT=3000
DEBUG=true
LOG_LEVEL=debug
AUTO_SEED=true
```

### Modo Produção

Para produção, configure:

```bash
NODE_ENV=production
PORT=3000
DEBUG=false
LOG_LEVEL=warn
AUTO_SEED=false
```

### Firebird Remoto

Se o Firebird está em outro servidor:

```bash
FIREBIRD_HOST=seu_ip_externo_ou_hostname
FIREBIRD_PORT=3050
# Certifique-se que a porta 3050 está aberta no firewall
```

### MySQL Remoto

Se o MySQL está em outro servidor:

```bash
DATABASE_URL=mysql://user:pass@seu_ip_mysql:3306/segalla_orcamentos
# Certifique-se que o usuário tem permissões de acesso remoto
```

## Validação de Configuração

Após configurar o `.env`, valide as configurações:

```bash
# Testar conexão com MySQL
pnpm test:db

# Testar conexão com Firebird
pnpm test:firebird

# Testar todas as configurações
pnpm test:config
```

## Troubleshooting

### Erro: "FIREBIRD_HOST não configurado"

Certifique-se de que a variável está definida em `.env`:
```bash
grep FIREBIRD_HOST .env
```

### Erro: "DATABASE_URL inválida"

Verifique o formato da URL:
```
mysql://usuario:senha@host:porta/banco
```

### Erro: "JWT_SECRET muito curto"

A chave deve ter pelo menos 32 caracteres:
```bash
# Gerar chave segura
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Próximos Passos

1. Consulte `docs/BANCO_DE_DADOS.md` para estrutura do banco
2. Leia `docs/DEPLOY.md` para configurar produção
3. Veja `docs/API.md` para documentação da API
