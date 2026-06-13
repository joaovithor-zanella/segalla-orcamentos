# Correção do Erro "String Right Truncation" no Firebird

## Problema Original

O sistema estava retornando o seguinte erro ao tentar buscar produtos:

```
[Firebird] Erro na query: Dynamic SQL Error, SQL error code = -303, 
Arithmetic exception, numeric overflow, or string truncation, 
string right truncation
```

Este erro ocorre quando um valor de parâmetro é **maior do que o tamanho máximo do campo** no banco de dados Firebird.

## Causa Raiz

O Firebird tem campos com tamanhos específicos:

| Campo | Tabela | Tamanho | Tipo |
|-------|--------|--------|------|
| EMPRESA | TESTESTOQUE | 2 caracteres | VARCHAR(2) |
| CODIGO | TESTPRODUTOGERAL | 6 caracteres | VARCHAR(6) |
| DESCRICAO | TESTPRODUTOGERAL | 50 caracteres | VARCHAR(50) |
| FABRICANTE | TESTPRODUTOGERAL | 20 caracteres | VARCHAR(20) |
| REFERENCIA | TESTPRODUTOGERAL | 16 caracteres | VARCHAR(16) |
| CODIGOFABRICA | TESTPRODUTOGERAL | 22 caracteres | VARCHAR(22) |

O erro ocorria em **dois cenários**:

### 1. Filtro de Empresa (EMPRESA = ?)

**Problema**: O valor `companyValue` estava sendo passado sem garantir que tivesse exatamente 2 caracteres.

**Exemplos que causavam erro**:
- Passar "1" em vez de "01" (1 caractere vs 2 esperados)
- Passar "001" (3 caracteres vs 2 esperados)
- Passar valores com espaços em branco

**Solução**: Implementar padding com zeros:
```typescript
const companyNum = parseInt(companyValue, 10);
if (!isNaN(companyNum) && companyNum >= 1 && companyNum <= 5) {
  companyValue = String(companyNum).padStart(2, "0");
}
// Resultado: "1" → "01", "2" → "02", etc.
```

### 2. Padrões LIKE (LIKE %valor%)

**Problema**: O padrão LIKE com wildcards (%) pode exceder o tamanho do campo.

**Exemplos que causavam erro**:
- Campo CODIGO tem 6 caracteres
- Padrão `%ABCDEF%` tem 8 caracteres (6 + 2 wildcards)
- Firebird rejeita porque 8 > 6

**Solução**: Usar a fórmula `tamanho_máximo_padrão = tamanho_campo - 2`:

| Campo | Tamanho | Máximo para Padrão | Cálculo |
|-------|---------|-------------------|---------|
| CODIGO | 6 | 4 | 6 - 2 = 4 |
| DESCRICAO | 50 | 48 | 50 - 2 = 48 |
| FABRICANTE | 20 | 18 | 20 - 2 = 18 |
| REFERENCIA | 16 | 14 | 16 - 2 = 14 |
| CODIGOFABRICA | 22 | 20 | 22 - 2 = 20 |

## Correções Implementadas

### Arquivo: `server/firebird.ts`

#### 1. Formatação de companyValue (linhas 338-354)

```typescript
// Usar companyFilter (string) em vez de companyId (número)
// IMPORTANTE: EMPRESA tem exatamente 2 caracteres no Firebird ("01", "02", ..., "05")
// Garantir que o valor seja sempre 2 caracteres com padding de zeros
let companyValue = (params.companyFilter ?? "").trim() || FB_FILTERS.COMPANY_VALUE;
if (companyValue) {
  // Converter para número, depois para string com 2 dígitos (padding com zero)
  const companyNum = parseInt(companyValue, 10);
  if (!isNaN(companyNum) && companyNum >= 1 && companyNum <= 5) {
    companyValue = String(companyNum).padStart(2, "0");
  } else {
    // Se não for válido, usar valor padrão
    companyValue = FB_FILTERS.COMPANY_VALUE;
  }
}
```

#### 2. Truncação de padrões LIKE (linhas 361-395)

```typescript
// Se houver busca, aplicar filtros
if (search) {
  // Limitar tamanho do padrão de busca para respeitar tamanhos dos campos no Firebird
  // IMPORTANTE: O padrão LIKE com wildcards (%) não pode exceder o tamanho do campo
  // Tamanhos dos campos: CODIGO: 6, DESCRICAO: 50, FABRICANTE: 20, REFERENCIA: 16, CODIGOFABRICA: 22
  // Fórmula: tamanho_máximo_padrão = tamanho_campo - 2 (para os 2 wildcards %)
  const maxSearchLength = 48; // Usar 48 para DESCRICAO (50 - 2 para wildcards)
  const truncatedSearch = search.substring(0, maxSearchLength);

  if (searchField === "code" || searchField === "all") {
    const codeSearch = truncatedSearch.substring(0, 4); // CODIGO: 6 - 2 = 4 caracteres
    whereConditions.push(`UPPER(PG.${FB_GERAL.CODE}) LIKE ?`);
    queryParams.push(`%${codeSearch}%`);
  }
  // ... (similar para outros campos)
}
```

#### 3. Logging detalhado de erros (linhas 207-211)

```typescript
if (err) {
  console.error("[Firebird] Erro na query:", err.message);
  console.error("[Firebird] SQL:", sql);
  console.error("[Firebird] Parâmetros:", params);
  console.error("[Firebird] Tamanho dos parâmetros:", 
    params.map((p, i) => `param[${i}]=${typeof p === 'string' ? `"${p}" (${p.length} chars)` : p}`));
  reject(new Error(`Erro na query Firebird: ${err.message}`));
  return;
}
```

## Testes Adicionados

### Arquivo: `server/firebird.test.ts`

Adicionados 8 testes para validar:

1. **Formatação de Company Value** (6 testes):
   - Conversão de single digit para 2 dígitos ("1" → "01")
   - Manutenção de valores já formatados ("01" → "01")
   - Tratamento de whitespace
   - Rejeição de valores inválidos (0, 6, 10, etc.)
   - Tratamento de decimais

2. **Validação de Padrões LIKE** (2 testes):
   - Garantir que padrões não excedem tamanho dos campos
   - Rejeitar padrões que excedem o limite

## Como Testar

1. **Executar os testes unitários**:
   ```bash
   pnpm test
   ```
   Resultado esperado: 44 testes passando

2. **Testar a busca de produtos via UI**:
   - Ir para a página de Produtos
   - Selecionar uma empresa (1-5)
   - Digitar um termo de busca
   - Verificar que os produtos são retornados sem erro

3. **Verificar logs de erro** (se houver):
   ```bash
   tail -f .manus-logs/devserver.log | grep "Firebird"
   ```

## Regras para Evitar Regressão

1. **Sempre validar tamanho de parâmetros** antes de passá-los para queries SQL
2. **Usar padding com zeros** para campos numéricos formatados (como EMPRESA)
3. **Subtrair 2 do tamanho do campo** quando usar LIKE com wildcards
4. **Adicionar logging detalhado** de SQL e parâmetros em caso de erro
5. **Escrever testes** para validar truncação e formatação

## Referências

- [Firebird SQL Error Code -303](https://firebirdsql.org/en/firebird-error-codes/)
- [VARCHAR Field Size Limits](https://firebirdsql.org/manual/ods.html)
- Documentação do projeto: `BANCO_DE_DADOS.md`
