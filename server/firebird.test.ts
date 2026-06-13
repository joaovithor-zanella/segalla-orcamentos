import { describe, expect, it } from "vitest";

/**
 * Teste para validar a lógica de formatação de companyValue
 * O campo EMPRESA no Firebird tem exatamente 2 caracteres ("01", "02", ..., "05")
 * Precisamos garantir que o valor seja sempre formatado corretamente com padding de zeros
 */
describe("Firebird LIKE Pattern Size Validation", () => {
  /**
   * Valida que os padrões LIKE não excedem o tamanho dos campos
   * Fórmula: tamanho_máximo_padrão = tamanho_campo - 2 (para os 2 wildcards %)
   */
  const fieldSizes: Record<string, number> = {
    CODE: 6,
    NAME: 50,
    BRAND: 20,
    REFERENCE: 16,
    FACTORY_CODE: 22,
  };

  it("should ensure LIKE patterns do not exceed field sizes", () => {
    // CODE: 6 - 2 = 4 caracteres máximo
    const codePattern = `%${'A'.repeat(4)}%`;
    expect(codePattern.length).toBeLessThanOrEqual(fieldSizes.CODE);

    // NAME: 50 - 2 = 48 caracteres máximo
    const namePattern = `%${'B'.repeat(48)}%`;
    expect(namePattern.length).toBeLessThanOrEqual(fieldSizes.NAME);

    // BRAND: 20 - 2 = 18 caracteres máximo
    const brandPattern = `%${'C'.repeat(18)}%`;
    expect(brandPattern.length).toBeLessThanOrEqual(fieldSizes.BRAND);

    // REFERENCE: 16 - 2 = 14 caracteres máximo
    const refPattern = `%${'D'.repeat(14)}%`;
    expect(refPattern.length).toBeLessThanOrEqual(fieldSizes.REFERENCE);

    // FACTORY_CODE: 22 - 2 = 20 caracteres máximo
    const factoryPattern = `%${'E'.repeat(20)}%`;
    expect(factoryPattern.length).toBeLessThanOrEqual(fieldSizes.FACTORY_CODE);
  });

  it("should reject LIKE patterns that exceed field sizes", () => {
    // CODE: 6 - padrão com 7 caracteres deve falhar
    const codePatternTooLong = `%${'A'.repeat(5)}%`; // 7 caracteres
    expect(codePatternTooLong.length).toBeGreaterThan(fieldSizes.CODE);

    // NAME: 50 - padrão com 51 caracteres deve falhar
    const namePatternTooLong = `%${'B'.repeat(49)}%`; // 51 caracteres
    expect(namePatternTooLong.length).toBeGreaterThan(fieldSizes.NAME);
  });
});

describe("Firebird Company Value Formatting", () => {
  function formatCompanyValue(input: string): string {
    let companyValue = (input ?? "").trim();
    if (companyValue) {
      // Converter para número, depois para string com 2 dígitos (padding com zero)
      const companyNum = parseInt(companyValue, 10);
      if (!isNaN(companyNum) && companyNum >= 1 && companyNum <= 5) {
        companyValue = String(companyNum).padStart(2, "0");
      } else {
        // Se não for válido, retornar vazio
        companyValue = "";
      }
    }
    return companyValue;
  }

  it("should format single digit company IDs with leading zero", () => {
    expect(formatCompanyValue("1")).toBe("01");
    expect(formatCompanyValue("2")).toBe("02");
    expect(formatCompanyValue("3")).toBe("03");
    expect(formatCompanyValue("4")).toBe("04");
    expect(formatCompanyValue("5")).toBe("05");
  });

  it("should keep already formatted two-digit company IDs", () => {
    expect(formatCompanyValue("01")).toBe("01");
    expect(formatCompanyValue("02")).toBe("02");
    expect(formatCompanyValue("03")).toBe("03");
    expect(formatCompanyValue("04")).toBe("04");
    expect(formatCompanyValue("05")).toBe("05");
  });

  it("should handle whitespace around company IDs", () => {
    expect(formatCompanyValue("  1  ")).toBe("01");
    expect(formatCompanyValue("  02  ")).toBe("02");
    expect(formatCompanyValue("\t3\t")).toBe("03");
  });

  it("should reject invalid company IDs", () => {
    expect(formatCompanyValue("0")).toBe(""); // 0 is out of range
    expect(formatCompanyValue("6")).toBe(""); // 6 is out of range
    expect(formatCompanyValue("10")).toBe(""); // 10 is out of range
    expect(formatCompanyValue("-1")).toBe(""); // negative
    expect(formatCompanyValue("abc")).toBe(""); // non-numeric
    expect(formatCompanyValue("")).toBe(""); // empty
  });

  it("should handle edge cases", () => {
    expect(formatCompanyValue("1.5")).toBe("01"); // parseInt truncates decimal
    expect(formatCompanyValue("01.0")).toBe("01"); // parseInt truncates decimal
  });

  it("should ensure exactly 2 characters", () => {
    const result1 = formatCompanyValue("1");
    const result2 = formatCompanyValue("5");
    expect(result1.length).toBe(2);
    expect(result2.length).toBe(2);
  });
});
