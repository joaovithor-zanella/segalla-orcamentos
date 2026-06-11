# Guia de Desocultação de Campos - Campos Ocultos por Motivos de Concorrência

Este documento explica como desocutar campos que estão ocultos no sistema por motivos de concorrência, mas continuam sendo pesquisáveis no backend.

## Campos Atualmente Ocultos

- **REFERÊNCIA** (reference)
- **CÓDIGO DE FABRICAÇÃO** (manufacturerCode)
- **DESCRIÇÃO** (description)

Esses campos são pesquisáveis na API, mas **não são exibidos** na tabela de produtos do frontend para proteger informações confidenciais.

---

## Como Desocutar Campos

### Passo 1: Editar `firebird.ts`

Abra o arquivo `/server/firebird.ts` e localize a seção `HIDDEN_FIELDS`:

```typescript
// ⚠️ HIDDEN_FIELDS: Campos pesquisáveis mas NÃO exibidos na UI (por concorrência)
// Para desocutar, remova o campo desta lista e adicione-o à interface FirebirdProduct
const HIDDEN_FIELDS = {
  REFERENCE: true,        // ← Remova esta linha para desocutar REFERÊNCIA
  FACTORY_CODE: true,     // ← Remova esta linha para desocutar CÓDIGO DE FABRICAÇÃO
  DESCRIPTION: true,      // ← Remova esta linha para desocutar DESCRIÇÃO
};
```

**Exemplo:** Para desocutar REFERÊNCIA, remova a linha `REFERENCE: true,`:

```typescript
const HIDDEN_FIELDS = {
  FACTORY_CODE: true,
  DESCRIPTION: true,
};
```

### Passo 2: Adicionar Campo à Interface `FirebirdProduct`

Localize a interface `FirebirdProduct` em `firebird.ts`:

```typescript
export interface FirebirdProduct {
  code: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  // Adicione o campo aqui:
  reference?: string;  // ← Adicione esta linha
}
```

### Passo 3: Mapear Campo na Função `searchProducts`

Localize a função `searchProducts` e adicione o mapeamento do campo:

```typescript
const product: FirebirdProduct = {
  code: row.CODIGO,
  name: row.DESCRICAO,
  brand: row.MARCA,
  price: parseFloat(row.PRECO) || 0,
  stock: parseInt(row.ESTOQUE) || 0,
  reference: row.REFERENCE,  // ← Adicione esta linha
};
```

### Passo 4: Atualizar Frontend para Exibir o Campo

Abra `/client/src/pages/Products.tsx` e adicione a coluna à tabela:

```typescript
// Na seção de cabeçalho da tabela (thead):
<th className="text-left px-4 py-3 font-semibold text-muted-foreground">Referência</th>

// Na seção de dados da tabela (tbody):
<td className="px-4 py-3 text-muted-foreground">
  {product.reference || "—"}
</td>
```

### Passo 5: Testar

1. Reinicie o servidor: `pnpm dev`
2. Acesse `/produtos`
3. Verifique se o campo agora aparece na tabela
4. Teste a pesquisa pelo novo campo

---

## Exemplo Completo: Desocultando REFERÊNCIA

### Arquivo: `server/firebird.ts`

**Antes:**
```typescript
const HIDDEN_FIELDS = {
  REFERENCE: true,
  FACTORY_CODE: true,
  DESCRIPTION: true,
};

export interface FirebirdProduct {
  code: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
}
```

**Depois:**
```typescript
const HIDDEN_FIELDS = {
  FACTORY_CODE: true,
  DESCRIPTION: true,
  // REFERENCE removido - agora é visível
};

export interface FirebirdProduct {
  code: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  reference?: string;  // ← Adicionado
}
```

### Arquivo: `client/src/pages/Products.tsx`

**Adicione à tabela:**
```typescript
<th className="text-left px-4 py-3 font-semibold text-muted-foreground">Referência</th>
// ...
<td className="px-4 py-3 text-muted-foreground">
  {product.reference || "—"}
</td>
```

---

## Campos Disponíveis para Desocultação

| Campo | Chave Firebird | Tipo | Descrição |
|-------|---|---|---|
| Referência | `REFERENCE` | string | Código de referência do produto |
| Código de Fabricação | `FACTORY_CODE` | string | Código do fabricante |
| Descrição | `DESCRIPTION` | string | Descrição completa do produto |

---

## Notas Importantes

- ⚠️ **Pesquisa funciona mesmo com campo oculto**: Você pode pesquisar por referência/código de fabricação mesmo que o campo não apareça na tabela
- 🔒 **Proteção de Concorrência**: Esses campos estão ocultos por padrão para proteger informações sensíveis
- 🔄 **Sincronização**: Após fazer alterações, o servidor precisa ser reiniciado para aplicar as mudanças
- 📝 **Backup**: Faça um backup de `firebird.ts` antes de fazer alterações

---

## Suporte

Se encontrar problemas ao desocutar campos, verifique:

1. Se o campo foi removido de `HIDDEN_FIELDS`
2. Se a interface `FirebirdProduct` foi atualizada
3. Se o mapeamento em `searchProducts` está correto
4. Se o servidor foi reiniciado após as alterações
5. Se o frontend foi recarregado no navegador (Ctrl+Shift+R)
