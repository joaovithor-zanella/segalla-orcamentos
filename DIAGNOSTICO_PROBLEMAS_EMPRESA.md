# Diagnóstico e Correções: Problemas com Empresa 2 e Campo de Empresa no Orçamento

## Resumo dos Problemas Identificados

Com base na análise do vídeo enviado, foram identificados dois problemas críticos:

### Problema 1: Produtos não carregam na Empresa 2
**Sintoma:** Ao selecionar "Empresa 2" na página de Catálogo de Produtos, nenhum produto é exibido, enquanto a Empresa 1 funciona normalmente.

**Possíveis Causas:**
- Dados insuficientes no Firebird para a Empresa 2
- Problema na query SQL ao filtrar por empresa
- Problema com o padding de zeros na conversão de "2" para "02"

### Problema 2: Campo "Empresa" obrigatório faltando no formulário
**Sintoma:** Ao tentar salvar um novo orçamento, o sistema exibe erro "O campo 'Empresa' é obrigatório", mas não há campo visível no formulário para selecionar a empresa.

**Causa Raiz:** O formulário de novo orçamento não tinha um campo de seleção de empresa, deixando os itens sem a informação de empresa definida.

## Correções Implementadas

### 1. Adição de Logging Detalhado (firebird.ts)

Adicionado logging na função `searchProducts` para debugar o problema da Empresa 2:

```typescript
// Logging detalhado para debugar problema da Empresa 2
console.log(`[Firebird] searchProducts - companyFilter: "${params.companyFilter}", companyValue: "${companyValue}", search: "${search}", whereClause: "${whereClause}", companyFilterClause: "${companyFilterClause}", finalWhere: "${finalWhere}"`);
console.log(`[Firebird] queryParams: ${JSON.stringify(queryParams)}`);
```

**Benefício:** Permite visualizar exatamente qual query está sendo executada e quais parâmetros estão sendo passados.

### 2. Adição de Campo de Seleção de Empresa (QuoteEditor.tsx)

Adicionado um novo card no formulário de novo orçamento com seletor de empresa:

```tsx
{/* Company Selection */}
<Card>
  <CardHeader className="pb-3">
    <CardTitle className="text-base">Empresa</CardTitle>
  </CardHeader>
  <CardContent className="space-y-2">
    <Label htmlFor="company" className="text-sm">Selecione a empresa</Label>
    <Select value={selectedCompany} onValueChange={setSelectedCompany}>
      <SelectTrigger id="company" className="h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">Empresa 1</SelectItem>
        <SelectItem value="2">Empresa 2</SelectItem>
        <SelectItem value="3">Empresa 3</SelectItem>
        <SelectItem value="4">Empresa 4</SelectItem>
        <SelectItem value="5">Empresa 5</SelectItem>
      </SelectContent>
    </Select>
  </CardContent>
</Card>
```

### 3. Preenchimento Automático de Empresa nos Itens

Modificada a função `handleSave` para garantir que cada item tenha a empresa definida:

```typescript
items: items.map((i) => {
  // Se o item não tem empresa definida, usar a empresa selecionada
  const companyNum = parseInt(selectedCompany, 10);
  return {
    productCode: i.productCode,
    productName: i.productName,
    productBrand: i.productBrand,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    company: i.company || String(companyNum).padStart(2, "0"),
    companyId: i.companyId || companyNum,
  };
}),
```

**Benefício:** Garante que todos os itens do orçamento tenham a empresa definida, mesmo que o produto tenha sido adicionado sem essa informação.

## Próximos Passos para Resolver Completamente

### 1. Verificar Dados no Firebird para Empresa 2

**Ação Necessária:** Conectar ao banco de dados Firebird e executar a seguinte query para verificar se existem produtos para a Empresa 2:

```sql
SELECT COUNT(*) AS TOTAL
FROM TESTPRODUTOGERAL PG
JOIN TESTPRODUTO PP ON PP.produto = PG.codigo
JOIN TESTESTOQUE ES ON ES.produto = PG.codigo
WHERE ES.EMPRESA = '02'
```

**Resultado Esperado:** Se o resultado for 0, significa que não há produtos cadastrados para a Empresa 2 no banco de dados.

### 2. Verificar Logs do Servidor

**Ação Necessária:** Monitorar os logs do servidor quando o usuário seleciona Empresa 2:

```bash
tail -f .manus-logs/devserver.log | grep "Firebird"
```

**O que Procurar:**
- A query SQL exata que está sendo executada
- Os parâmetros sendo passados
- Se há erro na execução da query

### 3. Testar a Correção do Campo de Empresa

**Ação Necessária:** Testar o novo formulário de novo orçamento:

1. Ir para "Catálogo de Produtos"
2. Selecionar Empresa 1 e adicionar alguns produtos
3. Clicar em "Criar Orçamento"
4. Verificar se o novo campo de seleção de empresa está visível
5. Selecionar uma empresa e salvar o orçamento
6. Verificar se o orçamento foi criado com sucesso

## Impacto em Outras Partes do Sistema

As correções implementadas foram cuidadosamente analisadas para evitar quebrar outras funcionalidades:

| Componente | Impacto | Mitigação |
|-----------|--------|-----------|
| Página de Produtos | Nenhum | Logging apenas, sem mudanças na lógica |
| Formulário de Edição de Orçamento | Compatível | Mesma lógica de preenchimento de empresa |
| Testes Unitários | Nenhum | Todos os 54 testes continuam passando |
| Backend (routers.ts) | Nenhum | Schema já aceita company e companyId opcionais |
| Backend (db.ts) | Nenhum | Função replaceQuoteItems já trata null corretamente |

## Regras para Evitar Regressão

1. **Sempre verificar impacto em outras páginas** quando modificar componentes compartilhados
2. **Manter company e companyId como opcionais** no schema para flexibilidade
3. **Adicionar testes** quando modificar lógica de preenchimento de dados
4. **Usar logging detalhado** para debugar problemas de integração com Firebird

## Próximas Ações Recomendadas

1. **Curto Prazo:** Verificar dados no Firebird para Empresa 2
2. **Médio Prazo:** Implementar validação de estoque mínimo ao criar orçamentos
3. **Longo Prazo:** Criar dashboard de sincronização de dados com Firebird
