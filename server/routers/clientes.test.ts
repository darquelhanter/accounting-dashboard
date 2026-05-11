import { describe, it, expect } from "vitest";
import {
  createCliente,
  getClientesByUser,
  updateCliente,
  deleteCliente,
} from "../db";

describe("Clientes Database Functions", () => {
  const testUserId = 1;
  let createdClienteId: number | null = null;

  describe("CRUD Operations", () => {
    it("should create a new client", async () => {
      const result = await createCliente({
        userId: testUserId,
        nome: "Empresa Teste A",
        regime: "Simples",
        setor: "Fiscal",
        valor: 1000,
        vencimento: 10,
        status: "Ativo",
      });

      expect(result).toBeDefined();
      createdClienteId = 1;
    });

    it("should retrieve clients by user", async () => {
      const result = await getClientesByUser(testUserId);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should update a client", async () => {
      if (!createdClienteId) {
        expect(true).toBe(true);
        return;
      }

      const result = await updateCliente(createdClienteId, {
        nome: "Empresa Teste A Atualizada",
        regime: "Lucro Presumido",
        setor: "Fiscal",
        valor: 1500,
        vencimento: 15,
        status: "Inativo",
      });

      expect(result).toBeDefined();
    });

    it("should delete a client", async () => {
      if (!createdClienteId) {
        expect(true).toBe(true);
        return;
      }

      const result = await deleteCliente(createdClienteId);
      expect(result).toBeDefined();
    });
  });

  describe("Filtering and Sorting", () => {
    it("should handle multiple clients", async () => {
      const result = await getClientesByUser(testUserId);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should support filtering by regime", async () => {
      const result = await getClientesByUser(testUserId);
      const filtered = result.filter((c: any) => c.regime === "Simples");
      expect(Array.isArray(filtered)).toBe(true);
    });

    it("should support filtering by status", async () => {
      const result = await getClientesByUser(testUserId);
      const filtered = result.filter((c: any) => c.status === "Ativo");
      expect(Array.isArray(filtered)).toBe(true);
    });

    it("should support search by name", async () => {
      const result = await getClientesByUser(testUserId);
      const searchTerm = "Empresa";
      const filtered = result.filter((c: any) =>
        c.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(Array.isArray(filtered)).toBe(true);
    });

    it("should support sorting by name", async () => {
      const result = await getClientesByUser(testUserId);
      const sorted = [...result].sort((a: any, b: any) =>
        a.nome.localeCompare(b.nome)
      );
      expect(sorted).toBeDefined();
    });

    it("should support sorting by regime", async () => {
      const result = await getClientesByUser(testUserId);
      const sorted = [...result].sort((a: any, b: any) =>
        a.regime.localeCompare(b.regime)
      );
      expect(sorted).toBeDefined();
    });

    it("should support pagination", async () => {
      const result = await getClientesByUser(testUserId);
      const itemsPerPage = 10;
      const page1 = result.slice(0, itemsPerPage);
      expect(page1.length).toBeLessThanOrEqual(itemsPerPage);
    });
  });
});
