import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from '../routers';
import type { TrpcContext } from '../_core/context';
import * as emailService from '../services/emailService';

// Mock do emailService
vi.mock('../services/emailService', () => ({
  sendNotificationEmail: vi.fn(),
  getObrigacaoVencimentoTemplate: vi.fn(() => '<html>Template</html>'),
  getMensalidadeAtrasadaTemplate: vi.fn(() => '<html>Template</html>'),
  getChecklistPendenteTemplate: vi.fn(() => '<html>Template</html>'),
}));

// Mock do getDb
vi.mock('../db', () => ({
  getDb: vi.fn(() => Promise.resolve(null)),
}));

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: 'sample-user',
    email: 'sample@example.com',
    name: 'Sample User',
    loginMethod: 'manus',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {
      clearCookie: () => {},
    } as TrpcContext['res'],
  };

  return ctx;
}

describe('notificacoesRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('testarEmail', () => {
    it('deve enviar email de teste com sucesso', async () => {
      const mockSendEmail = vi.spyOn(emailService, 'sendNotificationEmail').mockResolvedValue(true);
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notificacoes.testarEmail({ email: 'test@example.com' });

      expect(result.sucesso).toBe(true);
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: '✅ Email de Teste - Accounting Dashboard',
        })
      );
    });

    it('deve retornar erro ao falhar no envio de email', async () => {
      vi.spyOn(emailService, 'sendNotificationEmail').mockResolvedValue(false);
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notificacoes.testarEmail({ email: 'test@example.com' });

      expect(result.sucesso).toBe(false);
    });

    it('deve validar email inválido', async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.notificacoes.testarEmail({ email: 'invalid-email' });
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('Invalid email');
      }
    });
  });

  describe('enviarAlertsObrigacoes', () => {
    it('deve retornar erro quando banco de dados não está disponível', async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notificacoes.enviarAlertsObrigacoes({ diasAntecedencia: 7 });

      expect(result.sucesso).toBe(false);
      expect(result.erro).toBe('Database not available');
    });

    it('deve aceitar diasAntecedencia com valor padrão', async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notificacoes.enviarAlertsObrigacoes({});

      expect(result.sucesso).toBe(false);
      expect(result.erro).toBe('Database not available');
    });
  });

  describe('enviarAlertsMensalidades', () => {
    it('deve retornar erro quando banco de dados não está disponível', async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notificacoes.enviarAlertsMensalidades({ diasAtrasado: 1 });

      expect(result.sucesso).toBe(false);
      expect(result.erro).toBe('Database not available');
    });

    it('deve aceitar diasAtrasado com valor padrão', async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notificacoes.enviarAlertsMensalidades({});

      expect(result.sucesso).toBe(false);
      expect(result.erro).toBe('Database not available');
    });
  });

  describe('enviarAlertsChecklist', () => {
    it('deve retornar erro quando banco de dados não está disponível', async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notificacoes.enviarAlertsChecklist({ mes: 1, ano: 2026 });

      expect(result.sucesso).toBe(false);
      expect(result.erro).toBe('Database not available');
    });

    it('deve validar mes como número', async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.notificacoes.enviarAlertsChecklist({ mes: 'janeiro' as any, ano: 2026 });
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('Invalid input');
      }
    });

    it('deve validar ano como número', async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.notificacoes.enviarAlertsChecklist({ mes: 1, ano: '2026' as any });
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('Invalid input');
      }
    });
  });
});
