#!/bin/bash

# ============================================================
# SEGALLA - SISTEMA DE ORÇAMENTOS
# Script de Atualização
# ============================================================
# Este script atualiza o sistema para a versão mais recente
# Uso: bash scripts/update.sh

set -e

# ─── CORES PARA OUTPUT ─────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
print_header "ATUALIZAÇÃO DO SISTEMA"

# Obter versão atual
CURRENT_VERSION=$(grep '"version"' package.json | head -1 | awk -F'"' '{print $4}')
print_info "Versão atual: $CURRENT_VERSION"

# ─── FAZER BACKUP ─────────────────────────────────────────────────────────
print_header "FAZENDO BACKUP ANTES DA ATUALIZAÇÃO"

if [ -f "scripts/backup.sh" ]; then
  bash scripts/backup.sh
  print_success "Backup realizado com sucesso"
else
  print_warning "Script de backup não encontrado, pulando backup"
fi

# ─── PARAR SERVIDOR ────────────────────────────────────────────────────────
print_header "PARANDO SERVIDOR"

if command -v pm2 &> /dev/null; then
  print_info "Parando processo PM2..."
  pm2 stop ecosystem.config.js 2>/dev/null || print_warning "Nenhum processo PM2 em execução"
fi

# ─── ATUALIZAR CÓDIGO ─────────────────────────────────────────────────────
print_header "ATUALIZANDO CÓDIGO"

if command -v git &> /dev/null && [ -d ".git" ]; then
  print_info "Puxando atualizações do Git..."
  git pull origin main 2>/dev/null || print_warning "Falha ao fazer pull do Git"
else
  print_warning "Git não configurado, pulando atualização de código"
fi

# ─── ATUALIZAR DEPENDÊNCIAS ───────────────────────────────────────────────
print_header "ATUALIZANDO DEPENDÊNCIAS"

print_info "Instalando dependências..."
pnpm install

print_info "Atualizando dependências..."
pnpm update

print_success "Dependências atualizadas"

# ─── COMPILAR PROJETO ─────────────────────────────────────────────────────
print_header "COMPILANDO PROJETO"

print_info "Verificando TypeScript..."
pnpm check

print_info "Compilando para produção..."
pnpm build

print_success "Projeto compilado com sucesso"

# ─── EXECUTAR TESTES ──────────────────────────────────────────────────────
print_header "EXECUTANDO TESTES"

if pnpm test; then
  print_success "Todos os testes passaram"
else
  print_warning "Alguns testes falharam"
fi

# ─── INICIAR SERVIDOR ─────────────────────────────────────────────────────
print_header "INICIANDO SERVIDOR"

if command -v pm2 &> /dev/null; then
  print_info "Iniciando processo PM2..."
  pm2 start ecosystem.config.js 2>/dev/null || print_warning "Falha ao iniciar PM2"
  pm2 save
else
  print_warning "PM2 não instalado, servidor não foi iniciado automaticamente"
  print_info "Inicie manualmente com: pnpm start"
fi

# ─── OBTER NOVA VERSÃO ────────────────────────────────────────────────────
NEW_VERSION=$(grep '"version"' package.json | head -1 | awk -F'"' '{print $4}')

# ─── RESUMO FINAL ─────────────────────────────────────────────────────────
print_header "ATUALIZAÇÃO CONCLUÍDA!"

echo "Resumo:"
echo "  Versão anterior: $CURRENT_VERSION"
echo "  Versão atual: $NEW_VERSION"
echo "  Backup: backups/backup_*.sql.gz"
echo ""

if [ "$CURRENT_VERSION" != "$NEW_VERSION" ]; then
  print_success "Sistema atualizado de $CURRENT_VERSION para $NEW_VERSION"
else
  print_info "Nenhuma atualização de versão disponível"
fi

echo ""
echo "Próximos passos:"
echo "  1. Verifique se o servidor está rodando: ${BLUE}pm2 status${NC}"
echo "  2. Acesse: ${BLUE}http://localhost:3000${NC}"
echo "  3. Se houver problemas, restaure o backup anterior:"
echo "     ${BLUE}bash scripts/restore.sh <arquivo_backup>${NC}"
echo ""

exit 0
