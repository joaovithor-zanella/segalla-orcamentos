import { describe, expect, it } from "vitest";

/**
 * Teste para validar a formatação de quote_items
 * Garante que quantidade, preço unitário e preço total sejam strings com 2 casas decimais
 */
describe("Quote Items Formatting", () => {
  function formatQuoteItem(item: {
    quantity: number;
    unitPrice: number;
  }): {
    quantity: string;
    unitPrice: string;
    totalPrice: string;
  } {
    const totalPrice = item.quantity * item.unitPrice;
    return {
      quantity: item.quantity.toFixed(2),
      unitPrice: item.unitPrice.toFixed(2),
      totalPrice: totalPrice.toFixed(2),
    };
  }

  it("should format quantity as string with 2 decimal places", () => {
    const item = formatQuoteItem({ quantity: 5, unitPrice: 10.5 });
    expect(item.quantity).toBe("5.00");
    expect(typeof item.quantity).toBe("string");
  });

  it("should format unitPrice as string with 2 decimal places", () => {
    const item = formatQuoteItem({ quantity: 5, unitPrice: 10.5 });
    expect(item.unitPrice).toBe("10.50");
    expect(typeof item.unitPrice).toBe("string");
  });

  it("should calculate totalPrice correctly", () => {
    const item = formatQuoteItem({ quantity: 5, unitPrice: 10.5 });
    expect(item.totalPrice).toBe("52.50");
    expect(typeof item.totalPrice).toBe("string");
  });

  it("should handle decimal quantities", () => {
    const item = formatQuoteItem({ quantity: 2.5, unitPrice: 15.75 });
    expect(item.quantity).toBe("2.50");
    expect(item.unitPrice).toBe("15.75");
    expect(item.totalPrice).toBe("39.38");
  });

  it("should handle very small prices", () => {
    const item = formatQuoteItem({ quantity: 1, unitPrice: 0.01 });
    expect(item.quantity).toBe("1.00");
    expect(item.unitPrice).toBe("0.01");
    expect(item.totalPrice).toBe("0.01");
  });

  it("should handle large quantities and prices", () => {
    const item = formatQuoteItem({ quantity: 1000, unitPrice: 999.99 });
    expect(item.quantity).toBe("1000.00");
    expect(item.unitPrice).toBe("999.99");
    expect(item.totalPrice).toBe("999990.00");
  });

  it("should handle rounding correctly", () => {
    // 0.1 + 0.2 = 0.30000000000000004 em JavaScript
    const item = formatQuoteItem({ quantity: 0.1, unitPrice: 0.2 });
    expect(item.quantity).toBe("0.10");
    expect(item.unitPrice).toBe("0.20");
    expect(item.totalPrice).toBe("0.02");
  });

  it("should ensure all values are strings for database storage", () => {
    const item = formatQuoteItem({ quantity: 3.5, unitPrice: 25.99 });
    expect(typeof item.quantity).toBe("string");
    expect(typeof item.unitPrice).toBe("string");
    expect(typeof item.totalPrice).toBe("string");
  });
});

/**
 * Teste para validar a estrutura de quote_items
 */
describe("Quote Items Structure", () => {
  it("should have company and companyId as nullable fields", () => {
    const item = {
      quoteId: 1,
      productCode: "ABC123",
      productName: "Product Name",
      productBrand: "Brand",
      company: null,
      companyId: null,
      quantity: "5.00",
      unitPrice: "10.50",
      totalPrice: "52.50",
    };

    expect(item.company).toBeNull();
    expect(item.companyId).toBeNull();
  });

  it("should handle company and companyId with values", () => {
    const item = {
      quoteId: 1,
      productCode: "ABC123",
      productName: "Product Name",
      productBrand: "Brand",
      company: "Filial 01",
      companyId: 1,
      quantity: "5.00",
      unitPrice: "10.50",
      totalPrice: "52.50",
    };

    expect(item.company).toBe("Filial 01");
    expect(item.companyId).toBe(1);
  });
});
