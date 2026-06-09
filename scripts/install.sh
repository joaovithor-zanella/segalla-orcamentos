#!/bin/bash

# ============================================================
# SEGALLA - SISTEMA DE ORÇAMENTOS
# Script de Instalação Automática
# ============================================================
# Este script instala todas as dependências e configura o sistema
# Uso: sudo bash scripts/install.sh

set -e  # Parar se houver erro

# ─── CORES PARA OUTPUT ─────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─── FUNÇÕES AUXILIARES ────────────────────────────────────────────────────
print_header() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# ─── VERIFICAÇÕES INICIAIS ────────────────────────────────────────────────
print_header "VERIFICAÇÕES INICIAIS"

# Verificar se é root
if [[ $EUID -ne 0 ]]; then
  print_error "Este script deve ser executado como root (use: sudo bash scripts/install.sh)"
  exit 1
fi

# Verificar sistema operacional
if ! grep -q "Ubuntu" /etc/os-release; then
  print_warning "Este script foi testado em Ubuntu. Pode haver incompatibilidades."
fi

print_success "Verificações iniciais concluídas"

# ─── ATUALIZAR SISTEMA ─────────────────────────────────────────────────────
print_header "ATUALIZANDO SISTEMA"

apt update
apt upgrade -y
apt install -y curl wget git build-essential

print_success "Sistema atualizado"

# ─── INSTALAR NODE.JS ──────────────────────────────────────────────────────
print_header "INSTALANDO NODE.JS"

if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  print_info "Node.js já instalado: $NODE_VERSION"
else
  print_info "Instalando Node.js 18.x..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt install -y nodejs
  print_success "Node.js instalado: $(node --version)"
fi

# ─── INSTALAR PNPM ────────────────────────────────────────────────────────
print_header "INSTALANDO PNPM"

if command -v pnpm &> /dev/null; then
  PNPM_VERSION=$(pnpm --version)
  print_info "pnpm já instalado: $PNPM_VERSION"
else
  print_info "Instalando pnpm..."
  npm install -g pnpm
  print_success "pnpm instalado: $(pnpm --version)"
fi

# ─── INSTALAR MYSQL ───────────────────────────────────────────────────────
print_header "INSTALANDO MYSQL"

if command -v mysql &> /dev/null; then
  print_info "MySQL já instalado"
else
  print_info "Instalando MySQL Server..."
  apt install -y mysql-server
  systemctl start mysql
  systemctl enable mysql
  print_success "MySQL instalado e iniciado"
fi

# ─── CRIAR BANCO DE DADOS ──────────────────────────────────────────────────
print_header "CRIANDO BANCO DE DADOS"

# Verificar se banco já existe
if mysql -u root -e "USE segalla_orcamentos" 2>/dev/null; then
  print_warning "Banco de dados 'segalla_orcamentos' já existe"
  read -p "Deseja recriá-lo? (s/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    mysql -u root -e "DROP DATABASE segalla_orcamentos;"
    print_info "Banco anterior removido"
  else
    print_info "Mantendo banco existente"
  fi
fi

# Criar banco se não existir
if ! mysql -u root -e "USE segalla_orcamentos" 2>/dev/null; then
  print_info "Criando banco de dados..."
  mysql -u root < database/schema.sql
  print_success "Banco de dados criado"
  
  # Importar seeds
  print_info "Importando dados iniciais..."
  mysql -u root segalla_orcamentos < database/seeds.sql
  print_success "Dados iniciais importados"
else
  print_info "Banco de dados já existe, pulando importação"
fi

# ─── INSTALAR DEPENDÊNCIAS DO PROJETO ──────────────────────────────────────
print_header "INSTALANDO DEPENDÊNCIAS DO PROJETO"

if [ ! -d "node_modules" ]; then
  print_info "Instalando dependências com pnpm..."
  pnpm install
  print_success "Dependências instaladas"
else
  print_info "node_modules já existe, pulando instalação"
fi

# ─── CONFIGURAR VARIÁVEIS DE AMBIENTE ──────────────────────────────────────
print_header "CONFIGURANDO VARIÁVEIS DE AMBIENTE"

if [ ! -f ".env" ]; then
  print_info "Criando arquivo .env..."
  cp .env.example .env
  
  # Gerar JWT_SECRET seguro
  JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  sed -i "s/sua_chave_secreta_muito_segura_aqui_com_minimo_32_caracteres/$JWT_SECRET/" .env
  
  print_success "Arquivo .env criado com JWT_SECRET gerado"
  print_warning "IMPORTANTE: Edite .env com as configurações do seu Firebird:"
  print_warning "  - FIREBIRD_HOST"
  print_warning "  - FIREBIRD_DATABASE"
  print_warning "  - FIREBIRD_USER"
  print_warning "  - FIREBIRD_PASSWORD"
else
  print_info "Arquivo .env já existe"
fi

# ─── COMPILAR PROJETO ─────────────────────────────────────────────────────
print_header "COMPILANDO PROJETO"

print_info "Executando verificação TypeScript..."
pnpm check

print_info "Compilando para produção..."
pnpm build

print_success "Projeto compilado com sucesso"

# ─── CRIAR DIRETÓRIOS NECESSÁRIOS ──────────────────────────────────────────
print_header "CRIANDO DIRETÓRIOS"

mkdir -p logs backups
chmod 755 logs backups

print_success "Diretórios criados"

# ─── EXECUTAR TESTES ──────────────────────────────────────────────────────
print_header "EXECUTANDO TESTES"

if pnpm test; then
  print_success "Todos os testes passaram"
else
  print_warning "Alguns testes falharam, mas a instalação continua"
fi

# ─── RESUMO FINAL ─────────────────────────────────────────────────────────
print_header "INSTALAÇÃO CONCLUÍDA!"

echo -e "${GREEN}Segalla Sistema de Orçamentos instalado com sucesso!${NC}\n"

echo "Próximos passos:"
echo "1. Edite o arquivo .env com as configurações do seu Firebird"
echo "2. Inicie o servidor:"
echo "   - Desenvolvimento: ${BLUE}pnpm dev${NC}"
echo "   - Produção: ${BLUE}pnpm build && pnpm start${NC}"
echo "3. Acesse em: ${BLUE}http://localhost:3000${NC}"
echo "4. Login padrão:"
echo "   - Username: ${BLUE}admin${NC}"
echo "   - Senha: ${BLUE}Segalla@2025${NC}"
echo ""
echo "Para mais informações, consulte:"
echo "  - docs/INSTALACAO.md"
echo "  - docs/CONFIGURACAO.md"
echo "  - docs/BANCO_DE_DADOS.md"
echo ""

exit 0
