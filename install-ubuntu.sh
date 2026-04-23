#!/bin/bash

################################################################################
# Script de Instalação - Sistema Segalla de Orçamentos
# 
# Este script configura automaticamente o ambiente completo para rodar o
# sistema Segalla no Ubuntu (18.04+, 20.04, 22.04, 24.04)
#
# Uso: bash install-ubuntu.sh
#
################################################################################

set -e  # Sair em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
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

# Verificar se é root
check_sudo() {
    if [[ $EUID -ne 0 ]]; then
        print_error "Este script precisa ser executado com sudo"
        echo "Execute: sudo bash install-ubuntu.sh"
        exit 1
    fi
}

# Detectar versão do Ubuntu
detect_ubuntu() {
    if [[ ! -f /etc/os-release ]]; then
        print_error "Não é possível detectar a versão do Ubuntu"
        exit 1
    fi
    
    . /etc/os-release
    UBUNTU_VERSION=$VERSION_ID
    print_info "Versão do Ubuntu detectada: $UBUNTU_VERSION"
}

# Atualizar pacotes
update_packages() {
    print_header "Atualizando pacotes do sistema"
    apt update
    apt upgrade -y
    print_success "Pacotes atualizados"
}

# Instalar dependências do sistema
install_system_deps() {
    print_header "Instalando dependências do sistema"
    
    # Dependências básicas
    apt install -y \
        curl \
        wget \
        git \
        build-essential \
        python3 \
        python3-pip \
        firebird-client
    
    print_success "Dependências do sistema instaladas"
}

# Instalar Node.js
install_nodejs() {
    print_header "Instalando Node.js"
    
    # Verificar se Node.js já está instalado
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_info "Node.js já instalado: $NODE_VERSION"
        
        # Verificar se é versão 18+
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $NODE_MAJOR -lt 18 ]]; then
            print_warning "Node.js versão $NODE_VERSION detectada, mas versão 18+ é recomendada"
            read -p "Deseja atualizar? (s/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Ss]$ ]]; then
                curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
                apt install -y nodejs
                print_success "Node.js atualizado para $(node -v)"
            fi
        fi
    else
        # Instalar Node.js 20 LTS
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        apt install -y nodejs
        print_success "Node.js instalado: $(node -v)"
    fi
}

# Instalar pnpm
install_pnpm() {
    print_header "Instalando pnpm"
    
    if command -v pnpm &> /dev/null; then
        PNPM_VERSION=$(pnpm -v)
        print_info "pnpm já instalado: $PNPM_VERSION"
    else
        npm install -g pnpm
        print_success "pnpm instalado: $(pnpm -v)"
    fi
}

# Instalar dependências do projeto
install_project_deps() {
    print_header "Instalando dependências do projeto"
    
    cd "$(dirname "$0")"
    pnpm install
    print_success "Dependências do projeto instaladas"
}

# Criar arquivo .env.local
setup_env_file() {
    print_header "Configurando variáveis de ambiente"
    
    ENV_FILE=".env.local"
    
    if [[ -f "$ENV_FILE" ]]; then
        print_warning "Arquivo $ENV_FILE já existe"
        read -p "Deseja sobrescrever? (s/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            print_info "Usando arquivo $ENV_FILE existente"
            return
        fi
    fi
    
    cat > "$ENV_FILE" << 'EOF'
# ============================================================
# Configuração Local para Desenvolvimento
# ============================================================

NODE_ENV=development
PORT=3000

# ============================================================
# BANCO DE DADOS MANUS (MySQL)
# ============================================================
DATABASE_URL=mysql://root:password@localhost:3306/segalla_orcamentos

# ============================================================
# FIREBIRD 2.5 - ALTERE COM SEUS DADOS
# ============================================================

# IP ou hostname do servidor Firebird
FIREBIRD_HOST=127.0.0.1

# Porta padrão do Firebird
FIREBIRD_PORT=3050

# Caminho completo do arquivo .fdb
FIREBIRD_DATABASE=/dados/estoque.fdb

# Usuário do Firebird
FIREBIRD_USER=SYSDBA

# Senha do Firebird
FIREBIRD_PASSWORD=masterkey

# Charset do Firebird
FIREBIRD_CHARSET=WIN1252

# ============================================================
# AUTENTICAÇÃO (deixe vazio para desenvolvimento local)
# ============================================================
# OAUTH_SERVER_URL=
# VITE_OAUTH_PORTAL_URL=
# VITE_APP_ID=

# ============================================================
# Outras variáveis
# ============================================================
JWT_SECRET=dev-secret-key-change-in-production
EOF
    
    print_success "Arquivo $ENV_FILE criado"
    print_warning "⚠ IMPORTANTE: Edite o arquivo $ENV_FILE com as credenciais do seu Firebird"
}

# Criar diretório de logs
setup_logs_dir() {
    print_header "Criando diretório de logs"
    
    mkdir -p .manus-logs
    print_success "Diretório .manus-logs criado"
}

# Executar testes
run_tests() {
    print_header "Executando testes"
    
    pnpm test
    print_success "Testes executados com sucesso"
}

# Exibir instruções finais
show_final_instructions() {
    print_header "Instalação Concluída!"
    
    echo -e "${GREEN}Sistema Segalla de Orçamentos pronto para usar!${NC}\n"
    
    echo -e "${YELLOW}PRÓXIMOS PASSOS:${NC}\n"
    
    echo "1. ${BLUE}Configurar Firebird${NC}"
    echo "   Edite o arquivo .env.local com as credenciais do seu servidor Firebird:"
    echo "   - FIREBIRD_HOST: IP ou hostname do servidor"
    echo "   - FIREBIRD_PORT: Porta (padrão 3050)"
    echo "   - FIREBIRD_DATABASE: Caminho do arquivo .fdb"
    echo "   - FIREBIRD_USER: Usuário (padrão SYSDBA)"
    echo "   - FIREBIRD_PASSWORD: Senha"
    echo ""
    
    echo "2. ${BLUE}Iniciar o servidor${NC}"
    echo "   pnpm dev"
    echo ""
    
    echo "3. ${BLUE}Acessar o sistema${NC}"
    echo "   http://localhost:3000"
    echo ""
    
    echo "4. ${BLUE}Configurar banco de dados MySQL (opcional)${NC}"
    echo "   Se quiser usar um banco MySQL real em vez do padrão:"
    echo "   - Instale MySQL: sudo apt install mysql-server"
    echo "   - Crie o banco: mysql -u root -p"
    echo "   - Execute: CREATE DATABASE segalla_orcamentos;"
    echo "   - Atualize DATABASE_URL no .env.local"
    echo ""
    
    echo -e "${YELLOW}COMANDOS ÚTEIS:${NC}\n"
    echo "  pnpm dev       - Inicia servidor em desenvolvimento"
    echo "  pnpm build     - Compila para produção"
    echo "  pnpm start     - Inicia servidor de produção"
    echo "  pnpm test      - Executa testes"
    echo ""
    
    echo -e "${BLUE}Documentação: server/firebird.ts (comentários sobre configuração)${NC}\n"
}

# Função principal
main() {
    print_header "Sistema Segalla de Orçamentos - Instalação Ubuntu"
    
    check_sudo
    detect_ubuntu
    update_packages
    install_system_deps
    install_nodejs
    install_pnpm
    install_project_deps
    setup_env_file
    setup_logs_dir
    run_tests
    show_final_instructions
}

# Executar
main
