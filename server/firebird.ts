/**
 * ============================================================
 * INTEGRAÇÃO COM BANCO DE DADOS FIREBIRD 2.5
 * ============================================================
 *
 * CONFIGURAÇÃO NECESSÁRIA:
 * Antes de usar este módulo, configure as variáveis de ambiente
 * no arquivo .env ou nas secrets do projeto:
 *
 *   FIREBIRD_HOST=192.168.1.100       <- IP do servidor Firebird na sua rede
 *   FIREBIRD_PORT=3050                <- Porta padrão do Firebird (3050)
 *   FIREBIRD_DATABASE=/dados/estoque.fdb  <- Caminho completo do arquivo .fdb no servidor
 *   FIREBIRD_USER=SYSDBA              <- Usuário do Firebird
 *   FIREBIRD_PASSWORD=masterkey       <- Senha do Firebird
 *   FIREBIRD_CHARSET=WIN1252          <- Charset (WIN1252 ou UTF8)
 *
 * ============================================================
 * CONFIGURAÇÃO DAS TABELAS DO FIREBIRD
 * ============================================================
 *
 * Ajuste as constantes abaixo para corresponder às tabelas e
 * campos do seu banco de dados Firebird:
 */

// ============================================================
// NOME DA TABELA DE PRODUTOS NO FIREBIRD
// Altere para o nome exato da sua tabela de produtos/peças
// ============================================================
export const FB_TABLE_PRODUCTS = "PRODUTOS"; // <- ALTERE AQUI

// ============================================================
// CAMPOS DA TABELA DE PRODUTOS
// Altere cada valor para o nome exato do campo no Firebird
// ============================================================
export const FB_FIELDS = {
  // Campo: código único do produto (ex: "COD_PRODUTO", "CODIGO", "ID_PRODUTO")
  CODE: "CODIGO", // <- ALTERE AQUI

  // Campo: nome/descrição do produto (ex: "DESCRICAO", "NOME_PRODUTO", "DESC_PRODUTO")
  NAME: "DESCRICAO", // <- ALTERE AQUI

  // Campo: referência do fabricante (ex: "REFERENCIA", "REF_FABRICANTE", "COD_ORIGINAL")
  REFERENCE: "REFERENCIA", // <- ALTERE AQUI

  // Campo: preço de venda (ex: "PRECO_VENDA", "PRECO", "VLR_VENDA")
  PRICE: "PRECO_VENDA", // <- ALTERE AQUI

  // Campo: quantidade em estoque (ex: "ESTOQUE", "QTD_ESTOQUE", "SALDO")
  STOCK: "ESTOQUE", // <- ALTERE AQUI

  // Campo: unidade de medida (ex: "UNIDADE", "UN", "UNID") - opcional
  UNIT: "UNIDADE", // <- ALTERE AQUI (ou deixe vazio "" se não existir)

  // Campo: marca/fabricante (ex: "MARCA", "FABRICANTE") - opcional
  BRAND: "MARCA", // <- ALTERE AQUI (ou deixe vazio "" se não existir)
};

// ============================================================
// CAMPOS ADICIONAIS PARA FILTROS (opcional)
// Se quiser adicionar mais filtros, adicione campos aqui
// ============================================================
export const FB_EXTRA_FILTERS = {
  // Campo de categoria/grupo do produto - opcional
  CATEGORY: "GRUPO", // <- ALTERE AQUI (ou deixe vazio "" para ignorar)

  // Campo de status ativo/inativo - opcional
  ACTIVE: "ATIVO", // <- ALTERE AQUI (ou deixe vazio "" para ignorar)

  // Valor que indica produto ativo no campo ACTIVE (ex: "S", "1", "T")
  ACTIVE_VALUE: "S", // <- ALTERE AQUI
};

// ============================================================
// FIM DAS CONFIGURAÇÕES - não altere abaixo desta linha
// a menos que saiba o que está fazendo
// ============================================================

import Firebird from "node-firebird";

export interface FirebirdProduct {
  code: string;
  name: string;
  reference: string;
  price: number;
  stock: number;
  unit: string;
  brand: string;
}

function getFirebirdOptions(): Record<string, unknown> {
  return {
    host: process.env.FIREBIRD_HOST || "127.0.0.1",
    port: parseInt(process.env.FIREBIRD_PORT || "3050"),
    database: process.env.FIREBIRD_DATABASE || "/dados/estoque.fdb",
    user: process.env.FIREBIRD_USER || "SYSDBA",
    password: process.env.FIREBIRD_PASSWORD || "masterkey",
    charset: process.env.FIREBIRD_CHARSET || "WIN1252",
  };
}

/**
 * Executa uma query no Firebird e retorna os resultados.
 * Abre e fecha a conexão a cada chamada (stateless).
 */
async function queryFirebird<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const options = getFirebirdOptions();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Firebird as any).attach(options, (err: Error | null, db: any) => {
      if (err) {
        console.error("[Firebird] Erro ao conectar:", err.message);
        reject(new Error(`Falha na conexão com Firebird: ${err.message}`));
        return;
      }
      db.query(sql, params, (queryErr: Error | null, result: unknown) => {
        db.detach();
        if (queryErr) {
          console.error("[Firebird] Erro na query:", queryErr.message);
          reject(new Error(`Erro na query Firebird: ${queryErr.message}`));
          return;
        }
        resolve((result as T[]) || []);
      });
    });
  });
}

/**
 * Normaliza um valor do Firebird para string segura.
 */
function toStr(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

/**
 * Normaliza um valor do Firebird para número.
 */
function toNum(val: unknown): number {
  if (val === null || val === undefined) return 0;
  const n = parseFloat(String(val));
  return isNaN(n) ? 0 : n;
}

export interface ProductSearchParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ProductSearchResult {
  products: FirebirdProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  connected: boolean;
}

/**
 * Busca produtos no Firebird com filtros e paginação.
 * Pesquisa por código, nome ou referência.
 */
export async function searchProducts(
  params: ProductSearchParams
): Promise<ProductSearchResult> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const offset = (page - 1) * pageSize;
  const search = (params.search || "").trim().toUpperCase();

  const f = FB_FIELDS;
  const t = FB_TABLE_PRODUCTS;
  const extra = FB_EXTRA_FILTERS;

  // Monta cláusula WHERE
  let whereClause = "";
  const queryParams: unknown[] = [];

  const conditions: string[] = [];

  // Filtro de produto ativo (se configurado)
  if (extra.ACTIVE && extra.ACTIVE_VALUE) {
    conditions.push(`${extra.ACTIVE} = ?`);
    queryParams.push(extra.ACTIVE_VALUE);
  }

  // Filtro de busca por texto
  if (search) {
    const searchConditions: string[] = [];
    searchConditions.push(`UPPER(CAST(${f.CODE} AS VARCHAR(100))) LIKE ?`);
    queryParams.push(`%${search}%`);
    searchConditions.push(`UPPER(CAST(${f.NAME} AS VARCHAR(300))) LIKE ?`);
    queryParams.push(`%${search}%`);
    if (f.REFERENCE) {
      searchConditions.push(`UPPER(CAST(${f.REFERENCE} AS VARCHAR(120))) LIKE ?`);
      queryParams.push(`%${search}%`);
    }
    conditions.push(`(${searchConditions.join(" OR ")})`);
  }

  if (conditions.length > 0) {
    whereClause = `WHERE ${conditions.join(" AND ")}`;
  }

  // Query de contagem total
  const countSql = `SELECT COUNT(*) AS TOTAL FROM ${t} ${whereClause}`;

  // Query de dados com paginação via ROWS (Firebird 2.5 syntax)
  const firstRow = offset + 1;
  const lastRow = offset + pageSize;

  const selectFields = [
    `${f.CODE} AS CODE`,
    `${f.NAME} AS NAME`,
    f.REFERENCE ? `${f.REFERENCE} AS REFERENCE` : `'' AS REFERENCE`,
    `${f.PRICE} AS PRICE`,
    `${f.STOCK} AS STOCK`,
    f.UNIT ? `${f.UNIT} AS UNIT` : `'UN' AS UNIT`,
    f.BRAND ? `${f.BRAND} AS BRAND` : `'' AS BRAND`,
  ].join(", ");

  const dataSql = `
    SELECT FIRST ${pageSize} SKIP ${offset}
      ${selectFields}
    FROM ${t}
    ${whereClause}
    ORDER BY ${f.NAME}
  `;

  try {
    // Executa as duas queries em paralelo
    const [countResult, dataResult] = await Promise.all([
      queryFirebird<{ TOTAL: number }>(countSql, queryParams),
      queryFirebird<Record<string, unknown>>(dataSql, queryParams),
    ]);

    const total = toNum(countResult[0]?.TOTAL);
    const totalPages = Math.ceil(total / pageSize);

    const products: FirebirdProduct[] = dataResult.map((row) => ({
      code: toStr(row["CODE"]),
      name: toStr(row["NAME"]),
      reference: toStr(row["REFERENCE"]),
      price: toNum(row["PRICE"]),
      stock: toNum(row["STOCK"]),
      unit: toStr(row["UNIT"]) || "UN",
      brand: toStr(row["BRAND"]),
    }));

    return {
      products,
      total,
      page,
      pageSize,
      totalPages,
      connected: true,
    };
  } catch (error) {
    console.error("[Firebird] Erro ao buscar produtos:", error);
    // Retorna resultado vazio mas indica que não está conectado
    return {
      products: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      connected: false,
    };
  }
}

/**
 * Busca um produto específico pelo código no Firebird.
 */
export async function getProductByCode(code: string): Promise<FirebirdProduct | null> {
  const f = FB_FIELDS;
  const t = FB_TABLE_PRODUCTS;

  const selectFields = [
    `${f.CODE} AS CODE`,
    `${f.NAME} AS NAME`,
    f.REFERENCE ? `${f.REFERENCE} AS REFERENCE` : `'' AS REFERENCE`,
    `${f.PRICE} AS PRICE`,
    `${f.STOCK} AS STOCK`,
    f.UNIT ? `${f.UNIT} AS UNIT` : `'UN' AS UNIT`,
    f.BRAND ? `${f.BRAND} AS BRAND` : `'' AS BRAND`,
  ].join(", ");

  const sql = `SELECT FIRST 1 ${selectFields} FROM ${t} WHERE ${f.CODE} = ?`;

  try {
    const result = await queryFirebird<Record<string, unknown>>(sql, [code]);
    if (!result.length) return null;
    const row = result[0];
    return {
      code: toStr(row["CODE"]),
      name: toStr(row["NAME"]),
      reference: toStr(row["REFERENCE"]),
      price: toNum(row["PRICE"]),
      stock: toNum(row["STOCK"]),
      unit: toStr(row["UNIT"]) || "UN",
      brand: toStr(row["BRAND"]),
    };
  } catch (error) {
    console.error("[Firebird] Erro ao buscar produto por código:", error);
    return null;
  }
}

/**
 * Testa a conexão com o Firebird.
 * Retorna true se conectado, false caso contrário.
 */
export async function testFirebirdConnection(): Promise<{ connected: boolean; message: string }> {
  return new Promise((resolve) => {
    const options = getFirebirdOptions();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Firebird as any).attach(options, (err: Error | null, db: any) => {
      if (err) {
        resolve({
          connected: false,
          message: `Falha: ${err.message}`,
        });
        return;
      }
      db.detach();
      resolve({
        connected: true,
        message: "Conexão com Firebird estabelecida com sucesso.",
      });
    });
  });
}
