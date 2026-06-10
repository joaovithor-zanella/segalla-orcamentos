import { describe, it, expect } from "vitest";
import { ProductSearchParams, ProductSearchResult } from "./firebird";

/**
 * Testes para validar a estrutura e tipos da pesquisa de produtos
 */
describe("Product Search", () => {
  it("deve aceitar parâmetros de pesquisa básicos", () => {
    const params: ProductSearchParams = {
      search: "pneu",
      page: 1,
      pageSize: 20,
    };
    expect(params.search).toBe("pneu");
    expect(params.page).toBe(1);
    expect(params.pageSize).toBe(20);
  });

  it("deve aceitar campo de pesquisa específico", () => {
    const params: ProductSearchParams = {
      search: "ABC123",
      searchField: "code",
      page: 1,
    };
    expect(params.searchField).toBe("code");
  });

  it("deve aceitar ordenação por preço", () => {
    const params: ProductSearchParams = {
      search: "motor",
      sortBy: "price",
      sortOrder: "desc",
      page: 1,
    };
    expect(params.sortBy).toBe("price");
    expect(params.sortOrder).toBe("desc");
  });

  it("deve aceitar ordenação por nome", () => {
    const params: ProductSearchParams = {
      search: "motor",
      sortBy: "name",
      sortOrder: "asc",
      page: 1,
    };
    expect(params.sortBy).toBe("name");
    expect(params.sortOrder).toBe("asc");
  });

  it("deve aceitar pesquisa por referência", () => {
    const params: ProductSearchParams = {
      search: "REF-001",
      searchField: "reference",
      page: 1,
    };
    expect(params.searchField).toBe("reference");
  });

  it("deve aceitar pesquisa por código de fabricação", () => {
    const params: ProductSearchParams = {
      search: "MFG-ABC-123",
      searchField: "manufacturerCode",
      page: 1,
    };
    expect(params.searchField).toBe("manufacturerCode");
  });

  it("deve aceitar pesquisa em todos os campos", () => {
    const params: ProductSearchParams = {
      search: "termo",
      searchField: "all",
      page: 1,
    };
    expect(params.searchField).toBe("all");
  });

  it("deve validar resultado de pesquisa", () => {
    const result: ProductSearchResult = {
      products: [
        {
          code: "001",
          name: "Pneu 195/65R15",
          price: 250.0,
          stock: 10,
          brand: "Pirelli",
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      connected: true,
    };
    expect(result.products).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.connected).toBe(true);
  });

  it("deve indicar quando Firebird não está conectado", () => {
    const result: ProductSearchResult = {
      products: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
      connected: false,
    };
    expect(result.connected).toBe(false);
    expect(result.products).toHaveLength(0);
  });
});
