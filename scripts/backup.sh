#!/bin/bash

# ============================================================
# SEGALLA - SISTEMA DE ORÇAMENTOS
# Script de Backup do Banco de Dados
# ============================================================
# Este script realiza backup completo do banco de dados
# Uso: bash scripts/backup.sh

set -e

# ─── CONFIGURAÇÕES ────────────────────────────────────────────────────────
BACKUP_DIR="./backups"
DB_NAME="segalla_orcamentos"
DB_USER="segalla_user"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"
BACKUP_FILE_GZ="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

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

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# ─── VERIFICAÇÕES INICIAIS ────────────────────────────────────────────────
print_header "INICIANDO BACKUP"

# Verificar se diretório de backup existe
if [ ! -d "$BACKUP_DIR" ]; then
  print_info "Criando diretório de backup: $BACKUP_DIR"
  mkdir -p "$BACKUP_DIR"
fi

# Verificar se MySQL está rodando
if ! command -v mysqldump &> /dev/null; then
  print_error "mysqldump não encontrado. Instale MySQL client."
  exit 1
fi

# ─── EXECUTAR BACKUP ──────────────────────────────────────────────────────
print_info "Banco de dados: $DB_NAME"
print_info "Arquivo: $BACKUP_FILE_GZ"
print_info "Data: $TIMESTAMP"
echo ""

print_info "Realizando backup..."

# Fazer dump do banco
if mysqldump -u "$DB_USER" -p "$DB_NAME" 2>/dev/null > "$BACKUP_FILE"; then
  print_success "Dump realizado com sucesso"
else
  # Tentar sem senha (se estiver configurada no .my.cnf)
  if mysqldump -u "$DB_USER" "$DB_NAME" 2>/dev/null > "$BACKUP_FILE"; then
    print_success "Dump realizado com sucesso"
  else
    print_error "Falha ao realizar dump. Verifique credenciais do MySQL."
    rm -f "$BACKUP_FILE"
    exit 1
  fi
fi

# Comprimir backup
print_info "Comprimindo arquivo..."
if gzip "$BACKUP_FILE"; then
  print_success "Arquivo comprimido: $BACKUP_FILE_GZ"
else
  print_error "Falha ao comprimir arquivo"
  exit 1
fi

# ─── LIMPEZA DE BACKUPS ANTIGOS ────────────────────────────────────────────
print_info "Limpando backups antigos..."

MAX_BACKUPS=7
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | wc -l)

if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
  print_info "Encontrados $BACKUP_COUNT backups (máximo: $MAX_BACKUPS)"
  
  # Remover backups mais antigos
  ls -1t "$BACKUP_DIR"/backup_*.sql.gz | tail -n +$((MAX_BACKUPS + 1)) | while read file; do
    print_info "Removendo backup antigo: $(basename $file)"
    rm -f "$file"
  done
  
  print_success "Backups antigos removidos"
else
  print_info "Backups: $BACKUP_COUNT/$MAX_BACKUPS"
fi

# ─── OBTER INFORMAÇÕES DO BACKUP ──────────────────────────────────────────
BACKUP_SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)
BACKUP_LINES=$(zcat "$BACKUP_FILE_GZ" | wc -l)

# ─── RESUMO FINAL ─────────────────────────────────────────────────────────
print_header "BACKUP CONCLUÍDO COM SUCESSO!"

echo "Informações do backup:"
echo "  Arquivo: $BACKUP_FILE_GZ"
echo "  Tamanho: $BACKUP_SIZE"
echo "  Linhas: $BACKUP_LINES"
echo "  Data: $TIMESTAMP"
echo ""

echo "Backups disponíveis:"
ls -lh "$BACKUP_DIR"/backup_*.sql.gz | tail -5 | awk '{print "  " $9 " (" $5 ")"}'
echo ""

echo "Para restaurar este backup:"
echo "  ${BLUE}bash scripts/restore.sh $BACKUP_FILE_GZ${NC}"
echo ""

exit 0
