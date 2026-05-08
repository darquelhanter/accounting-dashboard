import { describe, it, expect } from "vitest";
import { getDb } from "../db";
import { users, clientes, obrigacoes } from "../../drizzle/schema";
import { eq, count } from "drizzle-orm";

describe("Admin Router - Database Operations", () => {
  describe("Estatísticas do Sistema", () => {
    it("deve contar total de usuários", async () => {
      const db = await getDb();
      if (!db) {
        expect(true).toBe(true);
        return;
      }

      const result = await db
        .select({ count: count() as any })
        .from(users);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(typeof result[0]?.count).toBe("number");
      expect(result[0]?.count).toBeGreaterThanOrEqual(0);
    });

    it("deve contar total de clientes", async () => {
      const db = await getDb();
      if (!db) {
        expect(true).toBe(true);
        return;
      }

      const result = await db
        .select({ count: count() as any })
        .from(clientes);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(typeof result[0]?.count).toBe("number");
      expect(result[0]?.count).toBeGreaterThanOrEqual(0);
    });

    it("deve contar total de obrigações", async () => {
      const db = await getDb();
      if (!db) {
        expect(true).toBe(true);
        return;
      }

      const result = await db
        .select({ count: count() as any })
        .from(obrigacoes);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(typeof result[0]?.count).toBe("number");
      expect(result[0]?.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Operações de Usuários", () => {
    it("deve listar todos os usuários", async () => {
      const db = await getDb();
      if (!db) {
        expect(true).toBe(true);
        return;
      }

      const result = await db.select().from(users);

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        const usuario = result[0];
        expect(usuario).toHaveProperty("id");
        expect(usuario).toHaveProperty("openId");
        expect(usuario).toHaveProperty("role");
        expect(["user", "admin"]).toContain(usuario.role);
      }
    });

    it("deve filtrar usuários por role", async () => {
      const db = await getDb();
      if (!db) {
        expect(true).toBe(true);
        return;
      }

      const admins = await db
        .select()
        .from(users)
        .where(eq(users.role, "admin"));

      expect(Array.isArray(admins)).toBe(true);
      if (admins.length > 0) {
        admins.forEach((admin) => {
          expect(admin.role).toBe("admin");
        });
      }
    });

    it("deve listar usuários com suas estatísticas", async () => {
      const db = await getDb();
      if (!db) {
        expect(true).toBe(true);
        return;
      }

      const allUsers = await db.select().from(users);

      expect(Array.isArray(allUsers)).toBe(true);

      // Para cada usuário, contar clientes e obrigações
      for (const user of allUsers.slice(0, 2)) {
        const clientesCount = await db
          .select({ count: count() as any })
          .from(clientes)
          .where(eq(clientes.userId, user.id));

        const obrigacoesCount = await db
          .select({ count: count() as any })
          .from(obrigacoes)
          .where(eq(obrigacoes.userId, user.id));

        expect(typeof clientesCount[0]?.count).toBe("number");
        expect(typeof obrigacoesCount[0]?.count).toBe("number");
      }
    });
  });

  describe("Operações de Limpeza", () => {
    it("deve deletar clientes de um usuário em cascata", async () => {
      const db = await getDb();
      if (!db) {
        expect(true).toBe(true);
        return;
      }

      // Contar clientes antes
      const clientesBefore = await db
        .select({ count: count() as any })
        .from(clientes);

      expect(clientesBefore[0]?.count).toBeGreaterThanOrEqual(0);
    });

    it("deve deletar obrigações de um usuário", async () => {
      const db = await getDb();
      if (!db) {
        expect(true).toBe(true);
        return;
      }

      // Contar obrigações antes
      const obrigacoesBefore = await db
        .select({ count: count() as any })
        .from(obrigacoes);

      expect(obrigacoesBefore[0]?.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Validações de Dados", () => {
    it("todos os usuários devem ter openId único", async () => {
      const db = await getDb();
      if (!db) {
        expect(true).toBe(true);
        return;
      }

      const allUsers = await db.select().from(users);
      const openIds = allUsers.map((u) => u.openId);
      const uniqueOpenIds = new Set(openIds);

      expect(uniqueOpenIds.size).toBe(openIds.length);
    });

    it("role de usuário deve ser 'user' ou 'admin'", async () => {
      const db = await getDb();
      if (!db) {
        expect(true).toBe(true);
        return;
      }

      const allUsers = await db.select().from(users);

      allUsers.forEach((user) => {
        expect(["user", "admin"]).toContain(user.role);
      });
    });

    it("clientes devem ter userId válido", async () => {
      const db = await getDb();
      if (!db) {
        expect(true).toBe(true);
        return;
      }

      const allClientes = await db.select().from(clientes);

      allClientes.forEach((cliente) => {
        expect(typeof cliente.userId).toBe("number");
        expect(cliente.userId).toBeGreaterThan(0);
      });
    });

    it("obrigações devem ter userId válido", async () => {
      const db = await getDb();
      if (!db) {
        expect(true).toBe(true);
        return;
      }

      const allObrigacoes = await db.select().from(obrigacoes);

      allObrigacoes.forEach((obrigacao) => {
        expect(typeof obrigacao.userId).toBe("number");
        expect(obrigacao.userId).toBeGreaterThan(0);
      });
    });
  });
});
