# Guia de Análise de Impacto de Alterações

## Objetivo

Este documento descreve a sistemática que DEVE ser seguida sempre que uma alteração for feita no código, especialmente em áreas críticas como banco de dados, autenticação, e fluxos de dados. O objetivo é garantir que nenhuma mudança quebre funcionalidades em outras partes do sistema.

## 1. Checklist de Verificação de Impacto

Antes de fazer commit de qualquer alteração, siga este checklist:

### 1.1 Alterações no Schema do Banco de Dados

Quando você modifica `drizzle/schema.ts`:

- [ ] **Verificar Foreign Keys**: A nova tabela/coluna cria uma dependência com outras tabelas?
- [ ] **Verificar Índices**: Quais índices são necessários para performance?
- [ ] **Verificar Constraints**: Há constraints que podem quebrar dados existentes?
- [ ] **Verificar Tipos de Dados**: Os tipos de dados são compatíveis com como são usados no código?
- [ ] **Gerar Migração**: Execute `pnpm drizzle-kit generate` para gerar a migração SQL
- [ ] **Revisar SQL Gerado**: Abra o arquivo `.sql` gerado e verifique se está correto
- [ ] **Testar Migração**: Execute a migração em um banco de dados de teste
- [ ] **Verificar Rollback**: A migração pode ser revertida sem perder dados?

### 1.2 Alterações em Procedures/Routers (tRPC)

Quando você modifica `server/routers.ts`:

- [ ] **Verificar Input/Output**: O schema de entrada/saída foi atualizado?
- [ ] **Verificar Autenticação**: A procedure está protegida corretamente?
- [ ] **Verificar Validação**: Todos os inputs estão sendo validados?
- [ ] **Verificar Erros**: Há tratamento de erro adequado?
- [ ] **Verificar Impacto no Frontend**: Quais componentes usam esta procedure?
- [ ] **Verificar Impacto no Banco**: A procedure acessa quais tabelas?
- [ ] **Executar Testes**: `pnpm test` deve passar sem erros

### 1.3 Alterações em Componentes Frontend

Quando você modifica `client/src/pages/*.tsx` ou `client/src/components/*.tsx`:

- [ ] **Verificar Props**: As props foram alteradas? Quais componentes usam este componente?
- [ ] **Verificar Hooks**: Quais hooks tRPC são usados?
- [ ] **Verificar Estado**: O estado local é compatível com o estado global?
- [ ] **Verificar Navegação**: A navegação está funcionando corretamente?
- [ ] **Verificar Responsividade**: O layout funciona em mobile?
- [ ] **Verificar Acessibilidade**: O componente é acessível?

### 1.4 Alterações em Helpers/Utilities

Quando você modifica `server/db.ts`, `server/firebird.ts`, etc:

- [ ] **Verificar Assinatura da Função**: Parâmetros/retorno foram alterados?
- [ ] **Verificar Quem Chama**: Quais procedures/funções chamam esta função?
- [ ] **Verificar Erros**: Há tratamento de erro adequado?
- [ ] **Verificar Performance**: A função é eficiente?
- [ ] **Verificar Logging**: Há logging suficiente para debugar?

## 2. Matriz de Impacto

Use esta matriz para entender como as alterações em uma área afetam outras:

| Área Alterada | Afeta | Verificar |
|---|---|---|
| Schema DB | Procedures, Frontend, Testes | Foreign keys, tipos de dados, índices |
| Procedure | Frontend, Testes, Banco | Input/output, autenticação, validação |
| Frontend | Procedures, Banco | Hooks tRPC, navegação, estado |
| Firebird Integration | Procedures, Frontend | Queries, performance, tratamento de erro |
| Autenticação | Procedures, Frontend, Banco | Permissões, roles, validação |
| Tipos (TypeScript) | Procedures, Frontend | Compatibilidade, type safety |

## 3. Fluxo de Alteração Segura

Siga este fluxo para fazer alterações de forma segura:

### Passo 1: Planejar a Alteração

```
1. Descrever o que vai mudar
2. Listar todas as áreas afetadas
3. Identificar riscos potenciais
4. Criar plano de testes
```

### Passo 2: Implementar a Alteração

```
1. Fazer a alteração no código
2. Executar testes locais
3. Verificar se há erros de compilação
4. Fazer commit com mensagem descritiva
```

### Passo 3: Verificar Impacto

```
1. Executar todos os testes: pnpm test
2. Verificar se há regressões
3. Testar fluxos relacionados manualmente
4. Revisar logs de erro
```

### Passo 4: Validar Banco de Dados

```
1. Se alterou schema, executar migração
2. Verificar integridade de dados
3. Verificar performance de queries
4. Fazer backup antes de alterações críticas
```

## 4. Exemplos de Análise de Impacto

### Exemplo 1: Adicionar Campo em quote_items

**Alteração:** Adicionar campo `discountPercent` na tabela `quote_items`

**Análise de Impacto:**

| Área | Impacto | Ação |
|---|---|---|
| Schema | Novo campo | Gerar migração SQL |
| Procedures | `quotes.create`, `quotes.update` | Atualizar input schema |
| Frontend | `QuoteEditor.tsx` | Adicionar input para desconto |
| Banco | Recalcular totais | Atualizar `recalcQuoteTotal` |
| Testes | Novos casos de teste | Adicionar testes para desconto |

**Checklist:**

```
- [ ] Gerar migração: pnpm drizzle-kit generate
- [ ] Revisar SQL gerado
- [ ] Atualizar schema.ts
- [ ] Atualizar routers.ts (input schema)
- [ ] Atualizar db.ts (se necessário)
- [ ] Atualizar QuoteEditor.tsx
- [ ] Atualizar recalcQuoteTotal
- [ ] Adicionar testes em quotes.test.ts
- [ ] Executar: pnpm test
- [ ] Testar fluxo completo manualmente
```

### Exemplo 2: Alterar Procedure de Busca de Produtos

**Alteração:** Adicionar filtro por faixa de preço em `products.search`

**Análise de Impacto:**

| Área | Impacto | Ação |
|---|---|---|
| Procedure | Novo input `minPrice`, `maxPrice` | Atualizar input schema |
| Frontend | `Products.tsx` | Adicionar inputs de preço |
| Firebird | Query SQL | Adicionar WHERE clause |
| Testes | Novos casos de teste | Testar filtros de preço |

**Checklist:**

```
- [ ] Atualizar input schema em routers.ts
- [ ] Atualizar query SQL em firebird.ts
- [ ] Adicionar inputs de preço em Products.tsx
- [ ] Testar query SQL manualmente
- [ ] Adicionar testes em firebird.test.ts
- [ ] Executar: pnpm test
- [ ] Testar filtros na UI
```

## 5. Verificação de Integridade do Banco de Dados

Sempre que fazer alterações no banco de dados, execute:

```bash
# Verificar estrutura das tabelas
mysql -u usuario -p segalla_orcamentos -e "SHOW TABLES;"

# Verificar estrutura de uma tabela
mysql -u usuario -p segalla_orcamentos -e "DESCRIBE quote_items;"

# Verificar foreign keys
mysql -u usuario -p segalla_orcamentos -e "SELECT CONSTRAINT_NAME, TABLE_NAME, REFERENCED_TABLE_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = 'segalla_orcamentos' AND REFERENCED_TABLE_NAME IS NOT NULL;"

# Verificar índices
mysql -u usuario -p segalla_orcamentos -e "SHOW INDEXES FROM quote_items;"

# Verificar integridade de dados
mysql -u usuario -p segalla_orcamentos -e "SELECT COUNT(*) FROM quotes WHERE userId NOT IN (SELECT id FROM users);"
```

## 6. Testes Automatizados

Sempre execute os testes antes de fazer commit:

```bash
# Executar todos os testes
pnpm test

# Executar testes de um arquivo específico
pnpm test server/quotes.test.ts

# Executar testes em modo watch
pnpm test --watch

# Executar com cobertura
pnpm test --coverage
```

## 7. Documentação de Alterações

Sempre que fizer uma alteração significativa, atualize:

1. **CHANGELOG.md**: Descrever a alteração
2. **INSTALLATION_GUIDE.md**: Se afeta instalação
3. **Comentários no Código**: Explicar por quê
4. **Commit Message**: Descrever o quê e por quê

Exemplo de commit message:

```
feat: adicionar filtro de preço na busca de produtos

- Adicionar inputs minPrice e maxPrice em Products.tsx
- Atualizar query SQL em firebird.ts para filtrar por preço
- Adicionar testes em firebird.test.ts
- Não há alterações no schema do banco

Impacto: Nenhuma regressão esperada
Testes: Todos os 54 testes passam
```

## 8. Rollback de Alterações

Se uma alteração causar problemas:

### Opção 1: Rollback de Código

```bash
git revert <commit-hash>
```

### Opção 2: Rollback de Banco de Dados

```bash
# Reverter última migração
pnpm drizzle-kit migrate --rollback
```

### Opção 3: Restaurar de Backup

```bash
mysql -u usuario -p segalla_orcamentos < backup.sql
```

## 9. Checklist Final

Antes de fazer deploy, verifique:

- [ ] Todos os testes passam: `pnpm test`
- [ ] Sem erros de TypeScript: `pnpm build`
- [ ] Sem warnings no console
- [ ] Banco de dados está íntegro
- [ ] Documentação foi atualizada
- [ ] Changelog foi atualizado
- [ ] Commit message está clara
- [ ] Nenhuma senha/token foi commitado
- [ ] Código foi revisado por outro desenvolvedor
- [ ] Testes manuais foram executados

## 10. Contatos e Escalação

Se você encontrar um problema durante a análise de impacto:

1. **Problema Menor**: Corrija e adicione um teste
2. **Problema Médio**: Crie uma issue e discuta com o time
3. **Problema Crítico**: Faça rollback imediatamente e escalpe para o lead técnico
