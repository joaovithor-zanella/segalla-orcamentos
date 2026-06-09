#!/bin/bash

# ============================================================
# SEGALLA - SISTEMA DE ORÇAMENTOS
# Script de Restauração de Backup
# ============================================================
# Este script restaura o banco de dados de um backup
# Uso: bash scripts/restore.sh <arquivo_backup.sql.gz>

set -e

# ─── CONFIGURAÇÕES ────────────────────────────────────────────────────────
DB_NAME="segalla_orcamentos"
DB_USER="segalla_user"

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
print_header "RESTAURAÇÃO DE BACKUP"

# Verificar argumentos
if [ $# -eq 0 ]; then
  print_error "Nenhum arquivo de backup especificado"
  echo ""
  echo "Uso: bash scripts/restore.sh <arquivo_backup>"
  echo ""
  echo "Exemplos:"
  echo "  bash scripts/restore.sh backups/backup_2024-01-15_10-30-00.sql.gz"
  echo "  bash scripts/restore.sh backups/backup_2024-01-15_10-30-00.sql"
  echo ""
  echo "Backups disponíveis:"
  ls -lh backups/backup_*.sql* 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}' || echo "  Nenhum backup encontrado"
  exit 1
fi

BACKUP_FILE="$1"

# Verificar se arquivo existe
if [ ! -f "$BACKUP_FILE" ]; then
  print_error "Arquivo não encontrado: $BACKUP_FILE"
  exit 1
fi

# ─── CONFIRMAÇÃO ──────────────────────────────────────────────────────────
print_warning "ATENÇÃO: Esta operação irá sobrescrever o banco de dados atual!"
print_warning "Banco: $DB_NAME"
print_warning "Arquivo: $BACKUP_FILE"
echo ""

read -p "Tem certeza que deseja restaurar? (digite 'sim' para confirmar): " -r
echo

if [[ ! $REPLY =~ ^[Ss][Ii][Mm]$ ]]; then
  print_info "Restauração cancelada"
  exit 0
fi

# ─── EXECUTAR RESTAURAÇÃO ────────────────────────────────────────────────
print_info "Iniciando restauração..."
echo ""

# Detectar se é arquivo comprimido
if [[ "$BACKUP_FILE" == *.gz ]]; then
  print_info "Arquivo comprimido detectado, descompactando..."
  TEMP_FILE="/tmp/backup_restore_$RANDOM.sql"
  
  if gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"; then
    print_success "Arquivo descompactado"
    RESTORE_FILE="$TEMP_FILE"
  else
    print_error "Falha ao descompactar arquivo"
    exit 1
  fi
else
  RESTORE_FILE="$BACKUP_FILE"
fi

# Restaurar banco
print_info "Restaurando banco de dados..."

if mysql -u "$DB_USER" -p "$DB_NAME" < "$RESTORE_FILE" 2>/dev/null; then
  print_success "Banco de dados restaurado com sucesso"
else
  # Tentar sem senha
  if mysql -u "$DB_USER" "$DB_NAME" < "$RESTORE_FILE" 2>/dev/null; then
    print_success "Banco de dados restaurado com sucesso"
  else
    print_error "Falha ao restaurar banco de dados"
    
    # Limpar arquivo temporário
    if [[ "$BACKUP_FILE" == *.gz ]]; then
      rm -f "$TEMP_FILE"
    fi
    
    exit 1
  fi
fi

# Limpar arquivo temporário
if [[ "$BACKUP_FILE" == *.gz ]]; then
  rm -f "$TEMP_FILE"
fi

# ─── VERIFICAÇÃO ──────────────────────────────────────────────────────────
print_info "Verificando integridade do banco..."

# Contar tabelas
TABLES=$(mysql -u "$DB_USER" -p "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | wc -l)

if [ "$TABLES" -gt 0 ]; then
  print_success "Banco de dados verificado: $TABLES tabelas encontradas"
else
  print_warning "Nenhuma tabela encontrada no banco"
fi

# ─── RESUMO FINAL ─────────────────────────────────────────────────────────
print_header "RESTAURAÇÃO CONCLUÍDA!"

echo "Informações:"
echo "  Banco: $DB_NAME"
echo "  Arquivo: $BACKUP_FILE"
echo "  Tabelas: $TABLES"
echo ""

echo "Próximos passos:"
echo "  1. Verifique se os dados foram restaurados corretamente"
echo "  2. Reinicie o servidor: ${BLUE}pnpm dev${NC} ou ${BLUE}pnpm start${NC}"
echo ""

exit 0
