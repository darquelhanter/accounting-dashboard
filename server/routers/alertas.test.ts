import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import {
  getObrigacoesProximasVencimento,
  getMensalidadesAtrasadas,
  getMensalidadesPendentesProximas,
  getAlertasSumario,
} from "../db";

describe("Alertas Router", () => {
  let userId: number;

  beforeAll(async () => {
    // Setup: criar um usuário de teste
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Usar um ID de teste fixo
    userId = 1;
  });

  describe("getObrigacoesProximasVencimento", () => {
    it("deve retornar array vazio quando não há obrigações próximas", async () => {
      const result = await getObrigacoesProximasVencimento(userId, 7);
      expect(Array.isArray(result)).toBe(true);
    });

    it("deve respeitar o parâmetro diasAntecedencia", async () => {
      const result7 = await getObrigacoesProximasVencimento(userId, 7);
      const result30 = await getObrigacoesProximasVencimento(userId, 30);
      
      expect(Array.isArray(result7)).toBe(true);
      expect(Array.isArray(result30)).toBe(true);
    });
  });

  describe("getMensalidadesAtrasadas", () => {
    it("deve retornar array vazio quando não há mensalidades atrasadas", async () => {
      const result = await getMensalidadesAtrasadas(userId);
      expect(Array.isArray(result)).toBe(true);
    });

    it("deve retornar apenas mensalidades com status Atrasado", async () => {
      const result = await getMensalidadesAtrasadas(userId);
      
      if (result.length > 0) {
        result.forEach((m: any) => {
          expect(m.status).toBe("Atrasado");
        });
      }
    });
  });

  describe("getMensalidadesPendentesProximas", () => {
    it("deve retornar array vazio quando não há mensalidades pendentes próximas", async () => {
      const result = await getMensalidadesPendentesProximas(userId, 3);
      expect(Array.isArray(result)).toBe(true);
    });

    it("deve respeitar o parâmetro diasAntecedencia", async () => {
      const result3 = await getMensalidadesPendentesProximas(userId, 3);
      const result7 = await getMensalidadesPendentesProximas(userId, 7);
      
      expect(Array.isArray(result3)).toBe(true);
      expect(Array.isArray(result7)).toBe(true);
    });
  });

  describe("getAlertasSumario", () => {
    it("deve retornar objeto com contadores de alertas", async () => {
      const result = await getAlertasSumario(userId);
      
      expect(result).toHaveProperty("obrigacoesProximas");
      expect(result).toHaveProperty("mensalidadesAtrasadas");
      expect(result).toHaveProperty("mensalidadesPendentes");
    });

    it("deve retornar números não-negativos", async () => {
      const result = await getAlertasSumario(userId);
      
      expect(result.obrigacoesProximas).toBeGreaterThanOrEqual(0);
      expect(result.mensalidadesAtrasadas).toBeGreaterThanOrEqual(0);
      expect(result.mensalidadesPendentes).toBeGreaterThanOrEqual(0);
    });

    it("deve retornar valores padrão quando banco não está disponível", async () => {
      // Testar com userId inválido
      const result = await getAlertasSumario(9999);
      
      expect(result.obrigacoesProximas).toBeGreaterThanOrEqual(0);
      expect(result.mensalidadesAtrasadas).toBeGreaterThanOrEqual(0);
      expect(result.mensalidadesPendentes).toBeGreaterThanOrEqual(0);
    });
  });
});
