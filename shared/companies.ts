/**
 * Configuração de Empresas/Filiais
 * 
 * Edite os nomes das empresas aqui. Cada empresa tem um ID de 1 a 5.
 * O campo `databaseCode` deve corresponder ao código usado no Firebird
 * para identificar qual filial o produto está em estoque.
 */

export const COMPANIES = {
  1: {
    id: 1,
    name: "Empresa 1",        // ← EDITE AQUI: Nome da sua primeira filial
    databaseCode: "FILIAL_1", // ← Código no Firebird (se aplicável)
    color: "#FF6B6B",         // Cor para identificação visual
  },
  2: {
    id: 2,
    name: "Empresa 2",        // ← EDITE AQUI: Nome da sua segunda filial
    databaseCode: "FILIAL_2",
    color: "#4ECDC4",
  },
  3: {
    id: 3,
    name: "Empresa 3",        // ← EDITE AQUI: Nome da sua terceira filial
    databaseCode: "FILIAL_3",
    color: "#45B7D1",
  },
  4: {
    id: 4,
    name: "Empresa 4",        // ← EDITE AQUI: Nome da sua quarta filial
    databaseCode: "FILIAL_4",
    color: "#96CEB4",
  },
  5: {
    id: 5,
    name: "Empresa 5",        // ← EDITE AQUI: Nome da sua quinta filial
    databaseCode: "FILIAL_5",
    color: "#FFEAA7",
  },
} as const;

export type CompanyId = keyof typeof COMPANIES;

export function getCompanyName(id: CompanyId | number): string {
  const company = COMPANIES[id as CompanyId];
  return company?.name || `Empresa ${id}`;
}

export function getCompanyColor(id: CompanyId | number): string {
  const company = COMPANIES[id as CompanyId];
  return company?.color || "#999999";
}

export function getAllCompanies() {
  return Object.values(COMPANIES);
}
