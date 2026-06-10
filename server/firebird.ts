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
 * CONFIGURAÇÃO DAS 4 TABELAS DO FIREBIRD
 * ============================================================
 *
 * Seu banco de dados tem 4 tabelas diferentes:
 * 1. TESTPRODUTOGERAL - Código e Descrição
 * 2. TESTEESTOQUE - Código, Marca, Estoque
 * 3. TESTPRODUTO - Código e Valor
 * 4. TESTMARCA - Nome da Marca e Código da Marca
 *
 * As queries abaixo fazem JOINs para trazer todas as informações
 * de forma coerente. Altere os nomes das tabelas e campos conforme necessário.
 */

// ============================================================
// TABELAS DO FIREBIRD
// ============================================================
export const FB_TABLES = {
  // Tabela com código e descrição do produto
  PRODUCT_GENERAL: "TESTPRODUTOGERAL", // <- ALTERE AQUI se necessário

  // Tabela com estoque e código da marca
  STOCK: "TESTEESTOQUE", // <- ALTERE AQUI se necessário

  // Tabela com código e preço do produto
  PRODUCT_PRICE: "TESTPRODUTO", // <- ALTERE AQUI se necessário

  // Tabela com nome e código da marca
  BRAND: "TESTMARCA", // <- ALTERE AQUI se necessário
};

// ============================================================
// CAMPOS DAS TABELAS
// ============================================================
export const FB_FIELDS = {
  // TESTPRODUTOGERAL
  PRODUCT_GENERAL: {
    CODE: "CODIGO", // <- ALTERE AQUI se necessário
    NAME: "DESCRICAO", // <- ALTERE AQUI se necessário
  },

  // TESTEESTOQUE
  STOCK: {
    CODE: "CODIGO", // <- ALTERE AQUI se necessário
    BRAND_CODE: "CODIGO_MARCA", // <- ALTERE AQUI se necessário (código que referencia TESTMARCA)
    QUANTITY: "ESTOQUE", // <- ALTERE AQUI se necessário
    RESERVED: "RESERVADO", // <- ALTERE AQUI se necessário (deixe vazio "" se não existir)
  },

  // TESTPRODUTO
  PRODUCT_PRICE: {
    CODE: "CODIGO", // <- ALTERE AQUI se necessário
    PRICE: "VALOR", // <- ALTERE AQUI se necessário
  },

  // TESTMARCA
  BRAND: {
    CODE: "CODIGO", // <- ALTERE AQUI se necessário (deve corresponder a STOCK.BRAND_CODE)
    NAME: "NOME", // <- ALTERE AQUI se necessário
  },
};

// ============================================================
// FIM DAS CONFIGURAÇÕES - não altere abaixo desta linha
// a menos que saiba o que está fazendo
// ============================================================

import Firebird from "node-firebird";

export interface FirebirdProduct {
  code: string;
  name: string;
  price: number;
  stock: number;
  brand: string;
  reference?: string; // Referência do produto
  manufacturerCode?: string; // Código de fabricação
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
  searchField?: "all" | "code" | "name" | "reference" | "brand" | "manufacturerCode"; // Campo para pesquisa
  sortBy?: "name" | "price"; // Campo para ordenação
  sortOrder?: "asc" | "desc"; // Ordem de classificação
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
 * Faz JOINs entre as 4 tabelas para trazer informações completas.
 * Suporta pesquisa avançada em múltiplos campos e ordenação.
 */
export async function searchProducts(
  params: ProductSearchParams
): Promise<ProductSearchResult> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const offset = (page - 1) * pageSize;
  const search = (params.search || "").trim().toUpperCase();
  const searchField = params.searchField || "all";
  const sortBy = params.sortBy || "name";
  const sortOrder = params.sortOrder || "asc";

  const t = FB_TABLES;
  const f = FB_FIELDS;

  // Monta cláusula WHERE com base no campo de pesquisa
  let whereClause = "";
  const queryParams: unknown[] = [];

  if (search) {
    const conditions: string[] = [];

    if (searchField === "all" || searchField === "code") {
      conditions.push(`UPPER(CAST(PG.${f.PRODUCT_GENERAL.CODE} AS VARCHAR(100))) LIKE ?`);
      queryParams.push(`%${search}%`);
    }

    if (searchField === "all" || searchField === "name") {
      conditions.push(`UPPER(CAST(PG.${f.PRODUCT_GENERAL.NAME} AS VARCHAR(300))) LIKE ?`);
      if (searchField === "all") {
        queryParams.push(`%${search}%`);
      } else {
        queryParams.push(`%${search}%`);
      }
    }

    if (searchField === "all" || searchField === "brand") {
      conditions.push(`UPPER(CAST(BR.${f.BRAND.NAME} AS VARCHAR(120))) LIKE ?`);
      if (searchField === "all") {
        queryParams.push(`%${search}%`);
      } else {
        queryParams.push(`%${search}%`);
      }
    }

    // Nota: reference e manufacturerCode não existem no Firebird atual
    // Eles podem ser adicionados no futuro quando o schema for atualizado

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(" OR ")}`;
    }
  }

  // Monta cláusula ORDER BY
  let orderClause = `ORDER BY PG.${f.PRODUCT_GENERAL.NAME} ASC`;
  if (sortBy === "price") {
    orderClause = `ORDER BY COALESCE(PP.${f.PRODUCT_PRICE.PRICE}, 0) ${sortOrder.toUpperCase()}`;
  } else {
    orderClause = `ORDER BY PG.${f.PRODUCT_GENERAL.NAME} ${sortOrder.toUpperCase()}`;
  }

  // Query de contagem total
  const countSql = `
    SELECT COUNT(DISTINCT PG.${f.PRODUCT_GENERAL.CODE}) AS TOTAL
    FROM ${t.PRODUCT_GENERAL} PG
    LEFT JOIN ${t.STOCK} ST ON PG.${f.PRODUCT_GENERAL.CODE} = ST.${f.STOCK.CODE}
    LEFT JOIN ${t.PRODUCT_PRICE} PP ON PG.${f.PRODUCT_GENERAL.CODE} = PP.${f.PRODUCT_PRICE.CODE}
    LEFT JOIN ${t.BRAND} BR ON ST.${f.STOCK.BRAND_CODE} = BR.${f.BRAND.CODE}
    ${whereClause}
  `;

  // Query de dados com paginação via FIRST/SKIP (Firebird 2.5 syntax)
  const dataSql = `
    SELECT FIRST ${pageSize} SKIP ${offset}
      PG.${f.PRODUCT_GENERAL.CODE} AS CODE,
      PG.${f.PRODUCT_GENERAL.NAME} AS NAME,
      COALESCE(PP.${f.PRODUCT_PRICE.PRICE}, 0) AS PRICE,
      COALESCE(ST.${f.STOCK.QUANTITY}, 0) AS STOCK,
      COALESCE(BR.${f.BRAND.NAME}, '') AS BRAND
    FROM ${t.PRODUCT_GENERAL} PG
    LEFT JOIN ${t.STOCK} ST ON PG.${f.PRODUCT_GENERAL.CODE} = ST.${f.STOCK.CODE}
    LEFT JOIN ${t.PRODUCT_PRICE} PP ON PG.${f.PRODUCT_GENERAL.CODE} = PP.${f.PRODUCT_PRICE.CODE}
    LEFT JOIN ${t.BRAND} BR ON ST.${f.STOCK.BRAND_CODE} = BR.${f.BRAND.CODE}
    ${whereClause}
    ${orderClause}
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
      price: toNum(row["PRICE"]),
      stock: toNum(row["STOCK"]),
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
 * Faz JOINs entre as 4 tabelas para trazer informações completas.
 */
export async function getProductByCode(code: string): Promise<FirebirdProduct | null> {
  const t = FB_TABLES;
  const f = FB_FIELDS;

  const sql = `
    SELECT FIRST 1
      PG.${f.PRODUCT_GENERAL.CODE} AS CODE,
      PG.${f.PRODUCT_GENERAL.NAME} AS NAME,
      COALESCE(PP.${f.PRODUCT_PRICE.PRICE}, 0) AS PRICE,
      COALESCE(ST.${f.STOCK.QUANTITY}, 0) AS STOCK,
      COALESCE(BR.${f.BRAND.NAME}, '') AS BRAND
    FROM ${t.PRODUCT_GENERAL} PG
    LEFT JOIN ${t.STOCK} ST ON PG.${f.PRODUCT_GENERAL.CODE} = ST.${f.STOCK.CODE}
    LEFT JOIN ${t.PRODUCT_PRICE} PP ON PG.${f.PRODUCT_GENERAL.CODE} = PP.${f.PRODUCT_PRICE.CODE}
    LEFT JOIN ${t.BRAND} BR ON ST.${f.STOCK.BRAND_CODE} = BR.${f.BRAND.CODE}
    WHERE PG.${f.PRODUCT_GENERAL.CODE} = ?
  `;

  try {
    const result = await queryFirebird<Record<string, unknown>>(sql, [code]);
    if (!result.length) return null;
    const row = result[0];
    return {
      code: toStr(row["CODE"]),
      name: toStr(row["NAME"]),
      price: toNum(row["PRICE"]),
      stock: toNum(row["STOCK"]),
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
