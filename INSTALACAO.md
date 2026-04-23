# Guia de Instalação - Sistema Segalla de Orçamentos

## Instalação Rápida (Recomendado)

Se você está usando **Ubuntu 18.04+, 20.04, 22.04 ou 24.04**, execute o script de instalação automática:

```bash
# Clonar ou copiar o projeto para seu Ubuntu
cd ~/sistema_orcamento

# Executar o script de instalação
sudo bash install-ubuntu.sh
```

O script irá:
- ✓ Atualizar pacotes do sistema
- ✓ Instalar Node.js 20 LTS
- ✓ Instalar pnpm (gerenciador de pacotes)
- ✓ Instalar dependências do projeto
- ✓ Configurar arquivo `.env.local`
- ✓ Executar testes
- ✓ Exibir instruções finais

---

## Instalação Manual

Se preferir instalar manualmente, siga os passos abaixo:

### 1. Atualizar o Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar Dependências do Sistema

```bash
sudo apt install -y \
    curl \
    wget \
    git \
    build-essential \
    python3 \
    python3-pip \
    firebird-client
```

### 3. Instalar Node.js (versão 18+)

```bash
# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node -v
npm -v
```

### 4. Instalar pnpm

```bash
sudo npm install -g pnpm

# Verificar instalação
pnpm -v
```

### 5. Instalar Dependências do Projeto

```bash
cd ~/sistema_orcamento
pnpm install
```

### 6. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
cat > .env.local << 'EOF'
# Modo de desenvolvimento
NODE_ENV=development
PORT=3000

# Banco de dados Manus
DATABASE_URL=mysql://root:password@localhost:3306/segalla_orcamentos

# Firebird 2.5 - ALTERE COM SEUS DADOS
FIREBIRD_HOST=192.168.1.100
FIREBIRD_PORT=3050
FIREBIRD_DATABASE=/dados/estoque.fdb
FIREBIRD_USER=SYSDBA
FIREBIRD_PASSWORD=masterkey
FIREBIRD_CHARSET=WIN1252

# Autenticação (deixe vazio para desenvolvimento local)
# OAUTH_SERVER_URL=
# VITE_OAUTH_PORTAL_URL=
# VITE_APP_ID=

# Outras variáveis
JWT_SECRET=dev-secret-key-change-in-production
EOF
```

### 7. Executar Testes

```bash
pnpm test
```

### 8. Iniciar o Servidor

```bash
pnpm dev
```

O sistema estará disponível em: **http://localhost:3000**

---

## Configuração do Firebird

### Alterar Credenciais de Conexão

Edite o arquivo `.env.local` com as informações do seu servidor Firebird:

| Variável | Descrição | Exemplo |
|---|---|---|
| `FIREBIRD_HOST` | IP ou hostname do servidor | `192.168.1.100` |
| `FIREBIRD_PORT` | Porta do Firebird | `3050` |
| `FIREBIRD_DATABASE` | Caminho do arquivo .fdb | `/dados/estoque.fdb` |
| `FIREBIRD_USER` | Usuário de acesso | `SYSDBA` |
| `FIREBIRD_PASSWORD` | Senha do usuário | `masterkey` |
| `FIREBIRD_CHARSET` | Charset do banco | `WIN1252` ou `UTF8` |

### Configurar Nomes de Tabelas e Campos

O sistema consulta o Firebird para buscar produtos. Para configurar quais tabelas e campos usar:

1. Abra o arquivo: `server/firebird.ts`
2. Procure pela seção de comentários `// ⚠️ CONFIGURAÇÃO MANUAL`
3. Altere os nomes das tabelas e campos conforme sua estrutura

Exemplo:

```typescript
// ⚠️ CONFIGURAÇÃO MANUAL - Altere com os nomes das suas tabelas
const PRODUTOS_TABLE = "PRODUTOS";        // Nome da tabela de produtos
const CODIGO_FIELD = "CODIGO";            // Campo de código
const NOME_FIELD = "DESCRICAO";           // Campo de nome/descrição
const REFERENCIA_FIELD = "REFERENCIA";    // Campo de referência
const PRECO_FIELD = "PRECO_VENDA";        // Campo de preço
const ESTOQUE_FIELD = "ESTOQUE";          // Campo de estoque
```

---

## Comandos Úteis

| Comando | Descrição |
|---|---|
| `pnpm dev` | Inicia servidor em desenvolvimento (porta 3000) |
| `pnpm build` | Compila para produção |
| `pnpm start` | Inicia servidor de produção |
| `pnpm test` | Executa testes automatizados |
| `pnpm check` | Verifica erros TypeScript |
| `pnpm format` | Formata código com Prettier |

---

## Solução de Problemas

### Erro: "OAUTH_SERVER_URL is not configured"

**Solução:** Este é um aviso normal em desenvolvimento local. O sistema usa autenticação local simplificada. Para usar OAuth em produção, configure as variáveis `OAUTH_SERVER_URL` e `VITE_APP_ID`.

### Erro: "Falha na conexão com Firebird"

**Solução:** O Firebird não está acessível. Verifique:
- IP e porta estão corretos em `.env.local`
- Firebird está rodando no servidor
- Firewall permite conexão na porta 3050
- Credenciais (usuário/senha) estão corretas

### Erro: "Cannot find module"

**Solução:** Reinstale as dependências:

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Porta 3000 já está em uso

**Solução:** Use outra porta:

```bash
PORT=3001 pnpm dev
```

---

## Próximos Passos

1. **Configurar Firebird**: Edite `.env.local` com credenciais do seu servidor
2. **Testar conexão**: Acesse http://localhost:3000 e teste o catálogo de produtos
3. **Cadastrar formas de pagamento**: Acesse Admin → Formas de Pagamento
4. **Criar primeiro orçamento**: Teste a funcionalidade completa
5. **Exportar orçamento**: Teste PDF, Excel e Word

---

## Suporte

Para dúvidas ou problemas:
- Verifique os logs em `.manus-logs/`
- Consulte a documentação em `server/firebird.ts`
- Verifique se o Firebird está acessível: `telnet FIREBIRD_HOST 3050`

---

**Versão:** 1.0.0  
**Última atualização:** Abril 2026
