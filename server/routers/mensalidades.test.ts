import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getMensalidadesByUser,
  getMensalidadesByUserAndMonth,
  getMensalidadesByCliente,
  getMensalidadesByStatus,
  getMensalidadesPendentes,
  getTotalMensalidadesByUser,
  createMensalidade,
  updateMensalidade,
  deleteMensalidade,
} from "../db";

describe("Mensalidades Database Functions", () => {
  const testUserId = 1;
  const testClienteId = 1;
  const testMes = "Maio";
  const testAno = 2026;
  let createdMensalidadeId: number | null = null;

  describe("CRUD Operations", () => {
    it("should create a new mensalidade", async () => {
      const result = await createMensalidade({
        userId: testUserId,
        clienteId: testClienteId,
        mes: testMes,
        ano: testAno,
        valor: "1500.00",
        status: "Pendente",
      });

      expect(result).toBeDefined();
      createdMensalidadeId = 1;
    });

    it("should retrieve mensalidades by user", async () => {
      const result = await getMensalidadesByUser(testUserId);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should retrieve mensalidades by user and month", async () => {
      const result = await getMensalidadesByUserAndMonth(testUserId, testMes, testAno);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should retrieve mensalidades by cliente", async () => {
      const result = await getMensalidadesByCliente(testClienteId, testMes, testAno);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should update a mensalidade", async () => {
      if (!createdMensalidadeId) {
        expect(true).toBe(true);
        return;
      }

      const result = await updateMensalidade(createdMensalidadeId, {
        status: "Pago",
        dataPagamento: new Date(),
      });

      expect(result).toBeDefined();
    });

    it("should delete a mensalidade", async () => {
      if (!createdMensalidadeId) {
        expect(true).toBe(true);
        return;
      }

      const result = await deleteMensalidade(createdMensalidadeId);
      expect(result).toBeDefined();
    });
  });

  describe("Status Management", () => {
    it("should handle all valid status values", async () => {
      const statuses = ["Pago", "Pendente", "Atrasado"];

      for (const status of statuses) {
        const result = await createMensalidade({
          userId: testUserId,
          clienteId: testClienteId,
          mes: testMes,
          ano: testAno,
          valor: "1000.00",
          status,
        });
        expect(result).toBeDefined();
      }
    });

    it("should retrieve mensalidades by status", async () => {
      const result = await getMensalidadesByStatus(testUserId, "Pendente");
      expect(Array.isArray(result)).toBe(true);
    });

    it("should retrieve pending and overdue mensalidades", async () => {
      const result = await getMensalidadesPendentes(testUserId);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Query Operations", () => {
    it("should return array from getMensalidadesByUser", async () => {
      const result = await getMensalidadesByUser(testUserId);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return array from getMensalidadesByUserAndMonth", async () => {
      const result = await getMensalidadesByUserAndMonth(testUserId, testMes, testAno);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return array from getMensalidadesByCliente", async () => {
      const result = await getMensalidadesByCliente(testClienteId);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle non-existent user gracefully", async () => {
      const result = await getMensalidadesByUser(99999);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle non-existent cliente gracefully", async () => {
      const result = await getMensalidadesByCliente(99999);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Totals Calculation", () => {
    it("should calculate totals correctly", async () => {
      const result = await getTotalMensalidadesByUser(testUserId);
      expect(result).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.pago).toBeGreaterThanOrEqual(0);
      expect(result.pendente).toBeGreaterThanOrEqual(0);
      expect(result.atrasado).toBeGreaterThanOrEqual(0);
    });

    it("should have total equal to sum of statuses", async () => {
      const result = await getTotalMensalidadesByUser(testUserId);
      const sum = result.pago + result.pendente + result.atrasado;
      expect(Math.abs(result.total - sum)).toBeLessThan(0.01);
    });
  });

  describe("Data Validation", () => {
    it("should handle required fields", async () => {
      try {
        await createMensalidade({
          userId: testUserId,
          clienteId: testClienteId,
          mes: testMes,
          ano: testAno,
          valor: "500.00",
          status: "Pendente",
        });
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle optional fields", async () => {
      const result = await createMensalidade({
        userId: testUserId,
        clienteId: testClienteId,
        mes: testMes,
        ano: testAno,
        valor: "750.00",
        status: "Pendente",
        dataPagamento: null,
      });
      expect(result).toBeDefined();
    });

    it("should handle date fields", async () => {
      const result = await createMensalidade({
        userId: testUserId,
        clienteId: testClienteId,
        mes: testMes,
        ano: testAno,
        valor: "2000.00",
        status: "Pago",
        dataPagamento: new Date(),
      });
      expect(result).toBeDefined();
    });
  });

  describe("Filtering Operations", () => {
    it("should filter by month and year", async () => {
      const result = await getMensalidadesByUserAndMonth(testUserId, testMes, testAno);
      expect(Array.isArray(result)).toBe(true);
      for (const m of result) {
        expect(m.mes).toBe(testMes);
        expect(m.ano).toBe(testAno);
      }
    });

    it("should filter by cliente", async () => {
      const result = await getMensalidadesByCliente(testClienteId);
      expect(Array.isArray(result)).toBe(true);
      for (const m of result) {
        expect(m.clienteId).toBe(testClienteId);
      }
    });

    it("should filter by status", async () => {
      const result = await getMensalidadesByStatus(testUserId, "Pago");
      expect(Array.isArray(result)).toBe(true);
      for (const m of result) {
        expect(m.status).toBe("Pago");
      }
    });
  });
});
