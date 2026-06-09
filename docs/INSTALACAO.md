# Guia de Instalação - Segalla Sistema de Orçamentos

## Requisitos Mínimos

### Hardware
- **CPU**: 2 núcleos (mínimo)
- **RAM**: 2 GB (mínimo), 4 GB recomendado
- **Disco**: 10 GB de espaço livre
- **Conexão**: Rede estável com acesso ao servidor Firebird

### Sistema Operacional
- **Ubuntu 22.04 LTS** ou superior
- Acesso root ou sudo
- Conexão com a internet para download de dependências

### Dependências do Sistema
- Node.js 18.x ou superior
- npm ou pnpm
- MySQL 5.7+ ou MariaDB 10.3+
- Git (opcional, para clonar o repositório)

## Instalação Rápida (Recomendado)

A forma mais rápida é usar o script de instalação automática:

```bash
# Clone ou copie o projeto para seu servidor
cd /opt
git clone <seu-repositorio> segalla-orcamentos
cd segalla-orcamentos

# Execute o script de instalação
sudo bash scripts/install.sh

# Configure as variáveis de ambiente
cp .env.example .env
nano .env  # Edite com suas configurações

# Inicie o sistema
pnpm dev  # Desenvolvimento
# ou
pnpm start  # Produção (após build)
```

## Instalação Manual Passo a Passo

### 1. Atualizar o Sistema Ubuntu

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

### 2. Instalar Node.js 18+

```bash
# Usando NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version  # v18.x.x
npm --version   # 9.x.x
```

### 3. Instalar pnpm (Gerenciador de Pacotes)

```bash
sudo npm install -g pnpm

# Verificar instalação
pnpm --version
```

### 4. Instalar MySQL/MariaDB

```bash
# Para Ubuntu 22.04
sudo apt install -y mysql-server

# Iniciar o serviço
sudo systemctl start mysql
sudo systemctl enable mysql

# Verificar status
sudo systemctl status mysql
```

### 5. Criar Banco de Dados

```bash
# Conectar ao MySQL como root
sudo mysql -u root

# Executar dentro do MySQL:
CREATE DATABASE segalla_orcamentos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'segalla_user'@'localhost' IDENTIFIED BY 'senha_segura_aqui';
GRANT ALL PRIVILEGES ON segalla_orcamentos.* TO 'segalla_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Verificar criação
sudo mysql -u segalla_user -p segalla_orcamentos -e "SELECT 1;"
```

### 6. Clonar/Copiar o Projeto

```bash
# Opção 1: Clonar do Git
cd /opt
git clone <seu-repositorio> segalla-orcamentos
cd segalla-orcamentos

# Opção 2: Copiar arquivos
mkdir -p /opt/segalla-orcamentos
cp -r /caminho/local/* /opt/segalla-orcamentos/
cd /opt/segalla-orcamentos
```

### 7. Instalar Dependências do Projeto

```bash
# Instalar dependências Node.js
pnpm install

# Verificar instalação
pnpm list
```

### 8. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar arquivo
nano .env

# Configurações essenciais a alterar:
# DATABASE_URL=mysql://segalla_user:senha_segura_aqui@localhost:3306/segalla_orcamentos
# FIREBIRD_HOST=seu_ip_firebird
# FIREBIRD_DATABASE=/caminho/seu_banco.fdb
# FIREBIRD_USER=SYSDBA
# FIREBIRD_PASSWORD=sua_senha_firebird
# JWT_SECRET=gerar_uma_chave_aleatoria_segura
```

### 9. Inicializar Banco de Dados

```bash
# Importar schema
sudo mysql -u segalla_user -p segalla_orcamentos < database/schema.sql

# Importar dados iniciais (seeds)
sudo mysql -u segalla_user -p segalla_orcamentos < database/seeds.sql

# Verificar tabelas criadas
sudo mysql -u segalla_user -p segalla_orcamentos -e "SHOW TABLES;"
```

### 10. Compilar Projeto

```bash
# Build para produção
pnpm build

# Verificar se build foi bem-sucedido
ls -la dist/
```

### 11. Iniciar o Sistema

```bash
# Modo desenvolvimento
pnpm dev

# Modo produção
NODE_ENV=production pnpm start

# Com PM2 (recomendado para produção)
pnpm add -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Comandos Úteis

### Desenvolvimento

```bash
# Iniciar servidor com hot reload
pnpm dev

# Executar testes
pnpm test

# Verificar tipos TypeScript
pnpm check

# Formatar código
pnpm format
```

### Banco de Dados

```bash
# Gerar migration
pnpm drizzle-kit generate

# Aplicar migration
pnpm drizzle-kit migrate

# Resetar banco (CUIDADO!)
sudo mysql -u segalla_user -p segalla_orcamentos < database/schema.sql
```

### Backup e Restauração

```bash
# Fazer backup
bash scripts/backup.sh

# Restaurar backup
bash scripts/restore.sh /caminho/do/backup.sql

# Listar backups
ls -lh backups/
```

### Atualização

```bash
# Atualizar para versão mais recente
bash scripts/update.sh

# Verificar versão atual
cat package.json | grep version
```

## Verificação de Instalação

Após completar a instalação, verifique se tudo está funcionando:

```bash
# 1. Verificar Node.js
node --version

# 2. Verificar pnpm
pnpm --version

# 3. Verificar MySQL
sudo systemctl status mysql

# 4. Verificar conexão com banco
sudo mysql -u segalla_user -p segalla_orcamentos -e "SELECT COUNT(*) FROM users;"

# 5. Testar servidor
pnpm dev

# 6. Acessar no navegador
# http://localhost:3000
```

## Solução de Problemas

### Erro: "Cannot find module 'mysql2'"

```bash
# Reinstalar dependências
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Erro: "Connection refused" ao conectar Firebird

```bash
# Verificar conectividade
ping seu_ip_firebird

# Testar porta Firebird
nc -zv seu_ip_firebird 3050

# Verificar configurações em .env
cat .env | grep FIREBIRD
```

### Erro: "Database connection error"

```bash
# Verificar MySQL está rodando
sudo systemctl status mysql

# Verificar credenciais
sudo mysql -u segalla_user -p segalla_orcamentos -e "SELECT 1;"

# Verificar DATABASE_URL em .env
cat .env | grep DATABASE_URL
```

### Erro: "Port 3000 already in use"

```bash
# Encontrar processo usando porta 3000
sudo lsof -i :3000

# Matar processo (se necessário)
sudo kill -9 <PID>

# Ou usar porta diferente
PORT=3001 pnpm dev
```

### Erro: "Permission denied" ao executar scripts

```bash
# Dar permissão de execução
chmod +x scripts/*.sh

# Executar com bash
bash scripts/install.sh
```

## Próximos Passos

1. **Configurar Firebird**: Edite `server/firebird.ts` com os nomes reais das suas tabelas
2. **Criar usuários**: Acesse `http://localhost:3000` e crie usuários no painel admin
3. **Configurar formas de pagamento**: Adicione as opções de pagamento no painel admin
4. **Testar orçamentos**: Crie um orçamento de teste e exporte em PDF/Excel/Word
5. **Configurar produção**: Veja `docs/DEPLOY.md` para deploy com Docker/PM2/Nginx

## Suporte

Para problemas ou dúvidas:

1. Consulte `docs/CONFIGURACAO.md` para ajustes avançados
2. Verifique `docs/BANCO_DE_DADOS.md` para estrutura do banco
3. Leia `docs/API.md` para documentação da API
4. Consulte `docs/DEPLOY.md` para deploy em produção

## Licença

Este projeto é propriedade de Segalla Peças Automotivas.
