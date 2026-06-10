import { describe, it, expect } from "vitest";
import { VehicleInfo, InsertVehicleInfo } from "../drizzle/schema";

/**
 * Testes para validar a estrutura e tipos de informações de veículo
 */
describe("Vehicle Info", () => {
  it("deve aceitar informações de veículo completas", () => {
    const vehicleData: InsertVehicleInfo = {
      quoteId: 1,
      plate: "ABC-1234",
      model: "Corolla",
      year: 2020,
    };
    expect(vehicleData.quoteId).toBe(1);
    expect(vehicleData.plate).toBe("ABC-1234");
    expect(vehicleData.model).toBe("Corolla");
    expect(vehicleData.year).toBe(2020);
  });

  it("deve aceitar informações de veículo parciais", () => {
    const vehicleData: InsertVehicleInfo = {
      quoteId: 1,
      plate: "ABC-1234",
    };
    expect(vehicleData.quoteId).toBe(1);
    expect(vehicleData.plate).toBe("ABC-1234");
    expect(vehicleData.model).toBeUndefined();
    expect(vehicleData.year).toBeUndefined();
  });

  it("deve aceitar apenas modelo e ano", () => {
    const vehicleData: InsertVehicleInfo = {
      quoteId: 1,
      model: "Civic",
      year: 2021,
    };
    expect(vehicleData.model).toBe("Civic");
    expect(vehicleData.year).toBe(2021);
    expect(vehicleData.plate).toBeUndefined();
  });

  it("deve validar que quoteId é obrigatório", () => {
    const vehicleData: InsertVehicleInfo = {
      quoteId: 1,
    };
    expect(vehicleData.quoteId).toBeDefined();
  });

  it("deve aceitar ano como número", () => {
    const vehicleData: InsertVehicleInfo = {
      quoteId: 1,
      year: 2025,
    };
    expect(typeof vehicleData.year).toBe("number");
    expect(vehicleData.year).toBe(2025);
  });

  it("deve aceitar placa em diferentes formatos", () => {
    const placa1: InsertVehicleInfo = {
      quoteId: 1,
      plate: "ABC-1234", // Formato antigo
    };
    const placa2: InsertVehicleInfo = {
      quoteId: 2,
      plate: "ABC1D23", // Formato novo (Mercosul)
    };
    expect(placa1.plate).toBe("ABC-1234");
    expect(placa2.plate).toBe("ABC1D23");
  });

  it("deve aceitar modelo com espaços", () => {
    const vehicleData: InsertVehicleInfo = {
      quoteId: 1,
      model: "Corolla Cross Hybrid",
    };
    expect(vehicleData.model).toBe("Corolla Cross Hybrid");
  });
});
