# Segalla - Sistema de Orçamentos para Peças Automotivas

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-18%2B-brightgreen.svg)
![Status](https://img.shields.io/badge/status-production%20ready-success.svg)

## 📋 Visão Geral

**Segalla** é um sistema web completo de gestão e montagem de orçamentos para distribuidoras de peças automotivas. Desenvolvido para ser usado em ambiente interno (VPN/intranet), com integração em tempo real com banco de dados Firebird 2.5, autenticação local, controle de acesso por usuário e exportação em múltiplos formatos.

### ✨ Características Principais

- **Autenticação Local**: Username/senha sem dependência de serviços externos
- **Controle de Acesso**: Usuários normais veem apenas seus orçamentos, admins veem todos
- **Integração Firebird**: Consulta em tempo real de produtos, preços e estoque
- **Catálogo Dinâmico**: Busca por código, nome, marca com filtros e paginação
- **Montagem de Orçamentos**: Interface intuitiva para adicionar produtos, quantidades e observações
- **Exportação Múltipla**: PDF, Excel e Word com identidade visual Segalla
- **Gestão de Usuários**: Admin cria, edita e deleta usuários locais
- **Formas de Pagamento**: Admin cadastra opções disponíveis
- **Dashboard Intuitivo**: Sidebar com navegação clara, layout responsivo
- **100% Independente**: Sem dependências de serviços em nuvem

---

## 🚀 Quick Start

### Instalação Rápida (Ubuntu 22.04+)

```bash
# Clone o repositório
git clone seu_repositorio segalla-orcamentos
cd segalla-orcamentos

# Execute o script de instalação
sudo bash scripts/install.sh

# Configure o Firebird (edite .env)
nano .env

# Inicie o servidor
pnpm dev
```

Acesse em: `http://localhost:3000`

**Login padrão:**
- Username: `admin`
- Senha: `Segalla@2025`

### Instalação com Docker

```bash
# Copie arquivo de ambiente
cp docker/.env.example .env

# Configure variáveis
nano .env

# Inicie containers
docker-compose -f docker/docker-compose.yml up -d

# Acesse
# http://localhost
```

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [INSTALACAO.md](docs/INSTALACAO.md) | Guia de instalação manual e automática |
| [CONFIGURACAO.md](docs/CONFIGURACAO.md) | Todas as variáveis de ambiente |
| [BANCO_DE_DADOS.md](docs/BANCO_DE_DADOS.md) | Estrutura do banco de dados |
| [DEPLOY_PRODUCAO.md](docs/DEPLOY_PRODUCAO.md) | Deploy em produção (Docker, PM2, Nginx) |

---

## 🏗️ Arquitetura

### Stack Tecnológico

```
Frontend:
├── React 19
├── Tailwind CSS 4
├── shadcn/ui
└── tRPC (type-safe API)

Backend:
├── Node.js 18+
├── Express 4
├── tRPC 11
├── Drizzle ORM
└── MySQL 8

Integração:
├── Firebird 2.5 (consulta)
├── PDFKit (PDF)
├── XLSX (Excel)
└── docx (Word)

DevOps:
├── Docker & Docker Compose
├── PM2 (process manager)
├── Nginx (reverse proxy)
└── Let's Encrypt (SSL)
```

### Estrutura de Diretórios

```
segalla-orcamentos/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilitários
│   └── public/            # Arquivos estáticos
├── server/                # Backend Node.js
│   ├── routers.ts         # Definição de APIs tRPC
│   ├── db.ts              # Query helpers
│   ├── firebird.ts        # Integração Firebird
│   ├── export.ts          # Exportação (PDF/Excel/Word)
│   └── _core/             # Infraestrutura
├── drizzle/               # Schema e migrations
├── database/              # SQL scripts
│   ├── schema.sql         # Estrutura do banco
│   └── seeds.sql          # Dados iniciais
├── scripts/               # Automação
│   ├── install.sh         # Instalação
│   ├── backup.sh          # Backup
│   ├── restore.sh         # Restauração
│   └── update.sh          # Atualização
├── docker/                # Docker
│   ├── Dockerfile         # Build image
│   ├── docker-compose.yml # Orquestração
│   └── nginx.conf         # Reverse proxy
├── nginx/                 # Nginx (manual)
│   └── segalla.conf       # Config Nginx
├── docs/                  # Documentação
├── ecosystem.config.js    # PM2 config
└── package.json           # Dependências
```

---

## 🔧 Configuração do Firebird

### Editar Tabelas e Campos

Abra `server/firebird.ts` e configure:

```typescript
// ─── CONFIGURAÇÃO DAS TABELAS ─────────────────────────────────────────
// ALTERE AQUI com os nomes das suas tabelas no Firebird

const FIREBIRD_CONFIG = {
  // Tabela de produtos (código + descrição)
  TABLE_PRODUCTS: 'TESTPRODUTOGERAL',
  FIELD_PRODUCT_CODE: 'CODIGO',
  FIELD_PRODUCT_NAME: 'DESCRICAO',

  // Tabela de estoque (código + marca + quantidade)
  TABLE_STOCK: 'TESTEESTOQUE',
  FIELD_STOCK_CODE: 'CODIGO',
  FIELD_STOCK_BRAND_CODE: 'CODIGO_MARCA',
  FIELD_STOCK_QUANTITY: 'ESTOQUE',

  // Tabela de preços (código + valor)
  TABLE_PRICES: 'TESTPRODUTO',
  FIELD_PRICE_CODE: 'CODIGO',
  FIELD_PRICE_VALUE: 'VALOR',

  // Tabela de marcas (código + nome)
  TABLE_BRANDS: 'TESTMARCA',
  FIELD_BRAND_CODE: 'CODIGO',
  FIELD_BRAND_NAME: 'NOME',
};
```

### Variáveis de Ambiente

Configure em `.env`:

```bash
FIREBIRD_HOST=192.168.1.100      # IP do servidor Firebird
FIREBIRD_PORT=3050               # Porta padrão
FIREBIRD_DATABASE=/dados/estoque.fdb  # Caminho do arquivo
FIREBIRD_USER=SYSDBA             # Usuário
FIREBIRD_PASSWORD=masterkey      # Senha
FIREBIRD_CHARSET=WIN1252         # Charset
```

---

## 👥 Gestão de Usuários

### Criar Usuário

1. Acesse **Administrador → Usuários**
2. Clique em **+ Novo Usuário**
3. Preencha:
   - **Username**: Identificador único (ex: `joao.silva`)
   - **Senha**: Mínimo 6 caracteres
   - **Nome Completo**: Nome do usuário
   - **Papel**: `Admin` ou `Usuário`
   - **Pode Ver Outros Orçamentos**: Sim/Não

### Papéis

| Papel | Permissões |
|-------|-----------|
| **Admin** | Cria/edita/deleta usuários, formas de pagamento, vê todos os orçamentos |
| **Usuário** | Cria/edita seus próprios orçamentos, vê apenas os seus |

---

## 📊 Operações Comuns

### Backup Manual

```bash
bash scripts/backup.sh
```

Cria arquivo comprimido em `backups/backup_YYYY-MM-DD_HH-MM-SS.sql.gz`

### Restaurar Backup

```bash
bash scripts/restore.sh backups/backup_2024-01-15_10-30-00.sql.gz
```

### Atualizar Sistema

```bash
bash scripts/update.sh
```

Faz backup, atualiza código, instala dependências, compila e reinicia.

### Ver Logs

```bash
# Desenvolvimento
pnpm dev

# Produção (PM2)
pm2 logs segalla-app

# Produção (Docker)
docker-compose -f docker/docker-compose.yml logs -f app
```

---

## 🔒 Segurança

### Checklist

- ✅ Autenticação local com hash bcrypt
- ✅ Isolamento de dados por usuário
- ✅ HTTPS/SSL em produção
- ✅ Headers de segurança (HSTS, X-Frame-Options, etc.)
- ✅ Proteção CSRF
- ✅ Validação de entrada
- ✅ Backup automático diário
- ✅ Logs de auditoria

### Boas Práticas

1. **Senhas Fortes**: Use senhas com 12+ caracteres
2. **Backups**: Configure backup automático via crontab
3. **Firewall**: Restrinja acesso às portas (22, 80, 443, 3306)
4. **SSL**: Use certificado válido em produção
5. **Atualizações**: Mantenha dependências atualizadas

---

## 🐛 Troubleshooting

### Aplicação não inicia

```bash
# Verificar erros
pnpm check

# Recompilar
pnpm build

# Ver logs
pnpm dev
```

### Firebird não conecta

```bash
# Testar conectividade
telnet FIREBIRD_HOST 3050

# Verificar variáveis
cat .env | grep FIREBIRD

# Adicionar logs em server/firebird.ts
```

### Banco de dados não conecta

```bash
# Verificar MySQL
sudo systemctl status mysql

# Testar conexão
mysql -u segalla_user -p segalla_orcamentos -e "SELECT 1;"
```

---

## 📦 Dependências Principais

| Pacote | Versão | Uso |
|--------|--------|-----|
| react | 19 | Frontend |
| express | 4 | Backend |
| trpc | 11 | API type-safe |
| drizzle-orm | 0.44 | ORM |
| mysql2 | 3.15 | Driver MySQL |
| node-firebird | 3.1 | Driver Firebird |
| pdfkit | 0.13 | Geração PDF |
| xlsx | 0.18 | Geração Excel |
| docx | 8.10 | Geração Word |

---

## 🚢 Deploy

### Docker (Recomendado)

```bash
docker-compose -f docker/docker-compose.yml up -d
```

### Manual (PM2 + Nginx)

```bash
# Compilar
pnpm build

# Iniciar
pm2 start ecosystem.config.js

# Configurar Nginx
sudo cp nginx/segalla.conf /etc/nginx/sites-available/segalla
sudo ln -s /etc/nginx/sites-available/segalla /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

Veja [DEPLOY_PRODUCAO.md](docs/DEPLOY_PRODUCAO.md) para detalhes completos.

---

## 📞 Suporte

### Documentação

- [docs/INSTALACAO.md](docs/INSTALACAO.md) - Guia de instalação
- [docs/CONFIGURACAO.md](docs/CONFIGURACAO.md) - Variáveis de ambiente
- [docs/BANCO_DE_DADOS.md](docs/BANCO_DE_DADOS.md) - Estrutura do banco
- [docs/DEPLOY_PRODUCAO.md](docs/DEPLOY_PRODUCAO.md) - Deploy em produção

### Logs

- `logs/app-out.log` - Saída da aplicação
- `logs/app-error.log` - Erros
- `logs/nginx/` - Logs do Nginx

### Backups

- `backups/` - Backups automáticos (7 últimos)

---

## 📝 Licença

MIT License - Veja LICENSE para detalhes

---

## 🎯 Roadmap

- [ ] Relatórios avançados com gráficos
- [ ] Integração com WhatsApp/Email
- [ ] Sincronização com ERP
- [ ] App mobile (React Native)
- [ ] Suporte a múltiplas moedas
- [ ] Assinatura digital de orçamentos

---

## 👨‍💻 Desenvolvido por

**Manus AI** - Sistema de Orçamentos Segalla v1.0.0

---

**Última atualização**: 2024-01-15
**Status**: ✅ Production Ready
