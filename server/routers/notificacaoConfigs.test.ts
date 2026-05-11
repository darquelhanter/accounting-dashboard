import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import * as db from "../db";

vi.mock("../db", () => ({
  getNotificacaoConfig: vi.fn(),
  createNotificacaoConfig: vi.fn(),
  updateNotificacaoConfig: vi.fn(),
  deleteNotificacaoConfig: vi.fn(),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
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

describe("notificacaoConfigs Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getConfig", () => {
    it("deve retornar configuração existente", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const mockConfig = {
        userId: 1,
        ativarMensalidades: true,
        diasAntecedencia: 3,
        ativarObrigacoes: true,
        ativarChecklist: true,
        horarioEnvio: "09:00",
        frequencia: "Diaria" as const,
        ativo: true,
      };

      vi.mocked(db.getNotificacaoConfig).mockResolvedValue(mockConfig);

      const result = await caller.notificacaoConfigs.getConfig();

      expect(result).toEqual(mockConfig);
      expect(db.getNotificacaoConfig).toHaveBeenCalledWith(1);
    });

    it("deve criar configuração padrão se não existir", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.getNotificacaoConfig).mockResolvedValue(null);
      vi.mocked(db.createNotificacaoConfig).mockResolvedValue(undefined);

      const result = await caller.notificacaoConfigs.getConfig();

      expect(result.ativarMensalidades).toBe(true);
      expect(result.diasAntecedencia).toBe(3);
      expect(result.frequencia).toBe("Diaria");
      expect(db.createNotificacaoConfig).toHaveBeenCalled();
    });
  });

  describe("updateConfig", () => {
    it("deve atualizar configuração existente", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const mockConfig = {
        userId: 1,
        ativarMensalidades: true,
        diasAntecedencia: 3,
      };

      vi.mocked(db.getNotificacaoConfig).mockResolvedValue(mockConfig as any);
      vi.mocked(db.updateNotificacaoConfig).mockResolvedValue(undefined);

      const result = await caller.notificacaoConfigs.updateConfig({
        ativarMensalidades: false,
        diasAntecedencia: 5,
      });

      expect(result.success).toBe(true);
      expect(db.updateNotificacaoConfig).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          ativarMensalidades: false,
          diasAntecedencia: 5,
        })
      );
    });

    it("deve criar configuração se não existir", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.getNotificacaoConfig).mockResolvedValue(null);
      vi.mocked(db.createNotificacaoConfig).mockResolvedValue(undefined);

      const result = await caller.notificacaoConfigs.updateConfig({
        ativarMensalidades: false,
        diasAntecedencia: 7,
      });

      expect(result.success).toBe(true);
      expect(db.createNotificacaoConfig).toHaveBeenCalled();
    });
  });

  describe("toggleNotifications", () => {
    it("deve ativar notificações", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const mockConfig = {
        userId: 1,
        ativo: false,
      };

      vi.mocked(db.getNotificacaoConfig).mockResolvedValue(mockConfig as any);
      vi.mocked(db.updateNotificacaoConfig).mockResolvedValue(undefined);

      const result = await caller.notificacaoConfigs.toggleNotifications({
        ativo: true,
      });

      expect(result.success).toBe(true);
      expect(result.ativo).toBe(true);
    });

    it("deve desativar notificações", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const mockConfig = {
        userId: 1,
        ativo: true,
      };

      vi.mocked(db.getNotificacaoConfig).mockResolvedValue(mockConfig as any);
      vi.mocked(db.updateNotificacaoConfig).mockResolvedValue(undefined);

      const result = await caller.notificacaoConfigs.toggleNotifications({
        ativo: false,
      });

      expect(result.success).toBe(true);
      expect(result.ativo).toBe(false);
    });
  });

  describe("resetToDefault", () => {
    it("deve redefinir configurações para padrão", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      vi.mocked(db.updateNotificacaoConfig).mockResolvedValue(undefined);

      const result = await caller.notificacaoConfigs.resetToDefault();

      expect(result.success).toBe(true);
      expect(result.message).toContain("padrão");
      expect(db.updateNotificacaoConfig).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          ativarMensalidades: true,
          diasAntecedencia: 3,
          frequencia: "Diaria",
        })
      );
    });
  });
});
