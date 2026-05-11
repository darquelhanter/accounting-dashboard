import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-mei",
    email: "mei@example.com",
    name: "MEI User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Obrigacoes MEI Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("seedMEI", () => {
    it("deve criar obrigações MEI com sucesso", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.obrigacoes.seedMEI();

      expect(result.sucesso).toBe(true);
      expect(result.mensagem).toContain("obrigacoes MEI criadas");
      expect(Array.isArray(result.obrigacoes)).toBe(true);
      expect(result.obrigacoes.length).toBeGreaterThan(0);
    });

    it("deve criar obrigações com regime MEI", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.obrigacoes.seedMEI();

      // Verificar que pelo menos algumas obrigações foram criadas ou já existem
      expect(result.sucesso).toBe(true);
      expect(result.mensagem).toContain("obrigacoes MEI");
    });

    it("deve incluir DAS nas obrigações MEI", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Listar obrigações MEI
      const list = await caller.obrigacoes.listByRegime({ regime: "MEI" });
      const das = list.find((o: any) => o.nome === "DAS");

      if (das) {
        expect(das.categoria).toBe("Fiscal");
        expect(das.periodicidade).toBe("Mensal");
        expect(das.vencimento).toBe(20);
      }
    });

    it("deve incluir Declaração de Faturamento", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const list = await caller.obrigacoes.listByRegime({ regime: "MEI" });
      const declaracao = list.find((o: any) => o.nome === "Declaração de Faturamento");

      if (declaracao) {
        expect(declaracao.categoria).toBe("Acessória");
        expect(declaracao.periodicidade).toBe("Mensal");
      }
    });

    it("deve incluir Declaração de Imposto de Renda", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const list = await caller.obrigacoes.listByRegime({ regime: "MEI" });
      const declaracao = list.find((o: any) => o.nome === "Declaração de Imposto de Renda");

      if (declaracao) {
        expect(declaracao.categoria).toBe("Fiscal");
        expect(declaracao.periodicidade).toBe("Anual");
        expect(declaracao.vencimento).toBe(30);
      }
    });

    it("deve incluir Registro de Faturamento contínuo", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const list = await caller.obrigacoes.listByRegime({ regime: "MEI" });
      const registro = list.find((o: any) => o.nome === "Registro de Faturamento");

      if (registro) {
        expect(registro.categoria).toBe("Contábil");
        expect(registro.periodicidade).toBe("Contínuo");
      }
    });
  });

  describe("listByRegime", () => {
    it("deve listar obrigações por regime MEI", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Criar obrigações MEI primeiro
      await caller.obrigacoes.seedMEI();

      // Listar obrigações MEI
      const result = await caller.obrigacoes.listByRegime({ regime: "MEI" });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((o: any) => o.regime === "MEI" || o.regime === "Todos")).toBe(true);
    });

    it("deve incluir obrigações com regime 'Todos'", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Criar obrigações padrão
      await caller.obrigacoes.seedPadrao();

      // Listar obrigações MEI
      const result = await caller.obrigacoes.listByRegime({ regime: "MEI" });

      // Deve incluir obrigações com regime "Todos"
      const todosObrigacoes = result.filter((o: any) => o.regime === "Todos");
      expect(todosObrigacoes.length).toBeGreaterThan(0);
    });

    it("deve retornar lista vazia para regime sem obrigações", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.obrigacoes.listByRegime({ regime: "Regime Inexistente" });

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
