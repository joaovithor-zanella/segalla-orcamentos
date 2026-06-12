/**
 * ============================================================
 * INTEGRAÇÃO COM BANCO DE DADOS FIREBIRD 2.5
 * ============================================================
 *
 * CONFIGURAÇÃO NECESSÁRIA:
 * Antes de usar este módulo, configure as variáveis de ambiente
 * no arquivo .env ou nas secrets do projeto:
 *
 *   FIREBIRD_HOST=192.168.1.100           <- IP do servidor Firebird na sua rede
 *   FIREBIRD_PORT=3050                    <- Porta padrão do Firebird (3050)
 *   FIREBIRD_DATABASE=/dados/estoque.fdb  <- Caminho completo do arquivo .fdb no servidor
 *   FIREBIRD_USER=SYSDBA                  <- Usuário do Firebird
 *   FIREBIRD_PASSWORD=masterkey           <- Senha do Firebird
 *   FIREBIRD_CHARSET=WIN1252              <- Charset (WIN1252 ou UTF8)
 *
 * ============================================================
 * ESTRUTURA DAS 4 TABELAS
 * ============================================================
 *
 *  TESTPRODUTOGERAL  → código do produto, descrição/nome, código da marca
 *  TESTESTOQUE       → código do produto, empresa, estoque disponível, reservado
 *  TESTPRODUTO       → código do produto, valor/preço, empresa
 *  TESTMARCA         → código da marca, nome da marca
 *
 *  JOIN utilizado:
 *    TESTPRODUTOGERAL (PG)
 *      JOIN TESTPRODUTO  (PP) ON PP.produto   = PG.codigo   (pelo código do produto)
 *      JOIN TESTESTOQUE  (ES) ON ES.produto   = PG.codigo   (pelo código do produto)
 *      JOIN TESTMARCA    (MA) ON MA.cod_marca = PG.cod_marca (pelo código da marca — está em TESTPRODUTOGERAL)
 *
 * ============================================================
 * CONFIGURAÇÃO DAS TABELAS — PREENCHA ABAIXO
 * ============================================================
 */

// ------------------------------------------------------------
// NOMES DAS TABELAS
// ------------------------------------------------------------
export const FB_TABLE_PRODUTO_GERAL = "TESTPRODUTOGERAL"; // <- confirme o nome da tabela
export const FB_TABLE_ESTOQUE       = "TESTESTOQUE";      // <- confirme o nome da tabela
export const FB_TABLE_PRODUTO       = "TESTPRODUTO";      // <- confirme o nome da tabela
export const FB_TABLE_MARCA         = "TESTMARCA";        // <- confirme o nome da tabela

// ------------------------------------------------------------
// CAMPOS DA TABELA: TESTPRODUTOGERAL
// Tem: código do produto, descrição/nome, código da marca
// ------------------------------------------------------------
export const FB_GERAL = {
  // Campo código do produto (usado no JOIN com TESTESTOQUE e TESTPRODUTO)
  CODE: "CODIGO",        // <- ALTERE para o nome exato do campo (ex: "CODIGO", "COD_PRODUTO")

  // Campo nome/descrição do produto
  NAME: "DESCRICAO",     // <- ALTERE para o nome exato do campo (ex: "DESCRICAO", "NOME")

  // Campo código da marca (usado no JOIN com TESTMARCA — está nesta tabela, não em TESTESTOQUE)
  BRAND_CODE: "FABRICANTE",        // <- ALTERE para o nome exato do campo (ex: "MARCA", "COD_MARCA", "ID_MARCA")

  // Campo referência do produto (ex: código do fornecedor, referência comercial)
  REFERENCE: "REFERENCIA",    // <- ALTERE para o nome exato do campo (ex: "REFERENCIA", "REF", "COD_REF")

  // Campo código de fábrica (ex: código original do fabricante, part number)
  FACTORY_CODE: "CODIGOFABRICA", // <- ALTERE para o nome exato do campo (ex: "COD_FABRICA", "COD_ORIGINAL", "PART_NUMBER")
};

// ------------------------------------------------------------
// CAMPOS DA TABELA: TESTESTOQUE
// Tem: código do produto, empresa, estoque disponível, reservado
// (NÃO tem código da marca — o código da marca está em TESTPRODUTOGERAL)
// ------------------------------------------------------------
export const FB_ESTOQUE = {
  // Campo código do produto (chave de JOIN com TESTPRODUTOGERAL e TESTPRODUTO)
  PRODUCT_CODE: "PRODUTO",    // <- ALTERE (ex: "PRODUTO", "COD_PRODUTO", "CODIGO")

  // Campo empresa (para filtrar por empresa específica, se necessário)
  COMPANY: "EMPRESA",         // <- ALTERE para o nome exato do campo (ex: "EMPRESA", "COD_EMPRESA")

  // Campo quantidade disponível em estoque
  STOCK: "ESTDISPONIVEL",           // <- ALTERE para o nome exato do campo (ex: "ESTOQUE", "QTD", "SALDO")

  // Campo indicador de reservado (ex: "S"/"N", 1/0, "T"/"F")
  RESERVED: "ESTRESERVADO",      // <- ALTERE para o nome exato do campo (ex: "RESERVADO", "BLOQUEADO")
};

// ------------------------------------------------------------
// CAMPOS DA TABELA: TESTPRODUTO
// Tem: código do produto, preço/valor, empresa
// ------------------------------------------------------------
export const FB_PRODUTO = {
  // Campo código do produto (chave de JOIN com TESTPRODUTOGERAL)
  PRODUCT_CODE: "PRODUTO",    // <- ALTERE (ex: "PRODUTO", "COD_PRODUTO", "CODIGO")

  // Campo preço/valor de venda
  PRICE: "CUSTOFINAL",             // <- ALTERE para o nome exato do campo (ex: "VALOR", "PRECO", "VLR_VENDA")

  // Campo empresa (para filtrar por empresa, se necessário)
  COMPANY: "EMPRESA",         // <- ALTERE para o nome exato do campo (ex: "EMPRESA", "COD_EMPRESA")
};

// ------------------------------------------------------------
// CAMPOS DA TABELA: TESTMARCA
// Tem: código da marca, nome da marca
// ------------------------------------------------------------
export const FB_MARCA = {
  // Campo código da marca (chave de JOIN com TESTPRODUTOGERAL — é por aqui que a marca se liga ao produto)
  BRAND_CODE: "CODIGO",       // <- ALTERE para o nome exato do campo (ex: "CODIGO", "COD_MARCA")

  // Campo nome da marca
  BRAND_NAME: "DESCRICAO",        // <- ALTERE para o nome exato do campo (ex: "MARCA", "NOME_MARCA", "FABRICANTE")
};

// ------------------------------------------------------------
// FILTROS OPCIONAIS
// ------------------------------------------------------------
export const FB_FILTERS = {
  // Para filtrar por uma empresa específica, informe o código aqui.
  // Se deixar vazio (""), o sistema busca de todas as empresas.
  COMPANY_VALUE: "",           // <- ALTERE (ex: "1", "01") ou deixe "" para sem filtro

  // Valor que indica "reservado = sim" no campo RESERVADO
  // Exemplos comuns: "S", "1", "T"
  RESERVED_YES_VALUE: "S",    // <- ALTERE conforme o seu banco
};

// ============================================================
// CAMPOS OCULTOS (Pesquisáveis mas não exibidos na UI)
// ============================================================
// Para desocutar campos no futuro, veja a documentação em:
// /HIDDEN_FIELDS_GUIDE.md
export const HIDDEN_FIELDS = {
  REFERENCE: true,      // Se true: pesquisável mas oculto na UI
  FACTORY_CODE: true,   // Se true: pesquisável mas oculto na UI
};

// ============================================================
// FIM DAS CONFIGURAÇÕES
// ============================================================

import Firebird from "node-firebird";

export interface FirebirdProduct {
  code: string;
  name: string;
  price: number;
  stock: number;
  brand: string;
  reference?: string;      // Campo oculto (pesquisável)
  factoryCode?: string;    // Campo oculto (pesquisável)
  reserved: string;        // valor bruto do campo (ex: "S", "N", "1", "0")
  isReserved: boolean;     // true se reserved === FB_FILTERS.RESERVED_YES_VALUE
  company: string;
  companyId?: number;      // ID da empresa (1-5)
}

export interface ProductSearchParams {
  search?: string;
  searchField?: "code" | "name" | "brand" | "reference" | "manufacturerCode" | "all";
  sortBy?: "name" | "price";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  companyId?: number; // Filtrar por empresa (1-5)
}

export interface ProductSearchResult {
  products: FirebirdProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  connected: boolean;
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

/**
 * Monta o SELECT com os 4 JOINs.
 *
 * Estrutura do JOIN:
 *   TESTPRODUTOGERAL (PG)
 *     JOIN TESTPRODUTO  (PP) ON PP.[PRODUCT_CODE] = PG.[CODE]
 *     JOIN TESTESTOQUE  (ES) ON ES.[PRODUCT_CODE] = PG.[CODE]
 *     JOIN TESTMARCA    (MA) ON MA.[BRAND_CODE]   = PG.[BRAND_CODE]  <- marca via TESTPRODUTOGERAL
 */
function buildSelectFields(): string {
  const pg = FB_TABLE_PRODUTO_GERAL;
  const pp = FB_TABLE_PRODUTO;
  const es = FB_TABLE_ESTOQUE;
  const ma = FB_TABLE_MARCA;

  const g  = FB_GERAL;
  const p  = FB_PRODUTO;
  const e  = FB_ESTOQUE;
  const m  = FB_MARCA;

  return `
    PG.${g.CODE}          AS CODE,
    PG.${g.NAME}          AS NAME,
    PG.${g.REFERENCE}     AS REFERENCE,
    PG.${g.FACTORY_CODE}  AS FACTORY_CODE,
    PP.${p.PRICE}         AS PRICE,
    ES.${e.STOCK}         AS STOCK,
    ES.${e.RESERVED}      AS RESERVED,
    ES.${e.COMPANY}       AS COMPANY,
    MA.${m.BRAND_NAME}    AS BRAND
  `;
}

function buildFromClause(): string {
  const pg = FB_TABLE_PRODUTO_GERAL;
  const pp = FB_TABLE_PRODUTO;
  const es = FB_TABLE_ESTOQUE;
  const ma = FB_TABLE_MARCA;

  const g = FB_GERAL;
  const p = FB_PRODUTO;
  const e = FB_ESTOQUE;
  const m = FB_MARCA;

  return `
    ${pg} PG
    JOIN ${pp} PP ON PP.${p.PRODUCT_CODE} = PG.${g.CODE}
    JOIN ${es} ES ON ES.${e.PRODUCT_CODE} = PG.${g.CODE}
    JOIN ${ma} MA ON MA.${m.BRAND_CODE}   = PG.${g.BRAND_CODE}
  `;
}

/**
 * Busca produtos no Firebird combinando as 4 tabelas.
 * Suporta pesquisa por múltiplos campos (código, nome, marca, referência, código de fabricação).
 * Referência e código de fabricação são pesquisáveis mas não exibidos na UI.
 */
export async function searchProducts(
  params: ProductSearchParams
): Promise<ProductSearchResult> {
  const page     = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const offset   = (page - 1) * pageSize;
  const search   = (params.search || "").trim().toUpperCase();
  const searchField = params.searchField || "all";
  const sortBy = params.sortBy || "name";
  const sortOrder = params.sortOrder || "asc";
  const companyId = params.companyId || 1; // Padrão: empresa 1

  if (!search) {
    return {
      products: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      connected: false,
    };
  }

  try {
    const g = FB_GERAL;
    const e = FB_ESTOQUE;

    // Construir cláusula WHERE baseado no campo de pesquisa
    let whereConditions: string[] = [];

    if (searchField === "code" || searchField === "all") {
      whereConditions.push(`UPPER(PG.${g.CODE}) LIKE '%${search}%'`);
    }
    if (searchField === "name" || searchField === "all") {
      whereConditions.push(`UPPER(PG.${g.NAME}) LIKE '%${search}%'`);
    }
    if (searchField === "brand" || searchField === "all") {
      whereConditions.push(`UPPER(MA.${FB_MARCA.BRAND_NAME}) LIKE '%${search}%'`);
    }
    if (searchField === "reference" || searchField === "all") {
      whereConditions.push(`UPPER(PG.${g.REFERENCE}) LIKE '%${search}%'`);
    }
    if (searchField === "manufacturerCode" || searchField === "all") {
      whereConditions.push(`UPPER(PG.${g.FACTORY_CODE}) LIKE '%${search}%'`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(" OR ")}`
      : "";

    // Filtrar por empresa selecionada
    const companyFilter = `AND ES.${e.COMPANY} = ${companyId}`;
    const finalWhere = whereClause + ` ${companyFilter}`;

    // Construir ORDER BY
    let orderBy = "ORDER BY PG." + g.NAME + " " + sortOrder.toUpperCase();
    if (sortBy === "price") {
      orderBy = "ORDER BY PP." + FB_PRODUTO.PRICE + " " + sortOrder.toUpperCase();
    }

    // Query para contar total
    const countSql = `
      SELECT COUNT(*) as TOTAL
      FROM ${buildFromClause()}
      ${finalWhere}
    `;

    const countResult = await queryFirebird<{ TOTAL: number }>(countSql);
    const total = countResult[0]?.TOTAL || 0;
    const totalPages = Math.ceil(total / pageSize);

    if (total === 0) {
      return {
        products: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        connected: true,
      };
    }

    // Query para buscar produtos com paginação
    const sql = `
      SELECT ${buildSelectFields()}
      FROM ${buildFromClause()}
      ${finalWhere}
      ${orderBy}
      ROWS ${offset + 1} TO ${offset + pageSize}
    `;

    const results = await queryFirebird<Record<string, unknown>>(sql);

    const products: FirebirdProduct[] = results.map((row) => ({
      code: toStr(row.CODE),
      name: toStr(row.NAME),
      reference: toStr(row.REFERENCE),
      factoryCode: toStr(row.FACTORY_CODE),
      price: toNum(row.PRICE),
      stock: toNum(row.STOCK),
      brand: toStr(row.BRAND),
      reserved: toStr(row.RESERVED),
      isReserved: toStr(row.RESERVED) === FB_FILTERS.RESERVED_YES_VALUE,
      company: toStr(row.COMPANY),
      companyId: companyId,
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
    console.error("[Firebird] Erro na busca de produtos:", error);
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
 * Busca todas as empresas disponíveis (1-5)
 */
export function getAvailableCompanies(): Array<{ id: number; name: string }> {
  return [
    { id: 1, name: "Empresa 1" },
    { id: 2, name: "Empresa 2" },
    { id: 3, name: "Empresa 3" },
    { id: 4, name: "Empresa 4" },
    { id: 5, name: "Empresa 5" },
  ];
}

/**
 * Testa a conexão com o Firebird
 */
export async function testFirebirdConnection(): Promise<boolean> {
  try {
    const sql = `SELECT FIRST 1 * FROM ${FB_TABLE_PRODUTO_GERAL}`;
    await queryFirebird(sql);
    return true;
  } catch (error) {
    console.error("[Firebird] Falha no teste de conexão:", error);
    return false;
  }
}
