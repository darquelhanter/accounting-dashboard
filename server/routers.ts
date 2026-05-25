import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { clientesRouter } from "./routers/clientes";
import { obrigacoesRouter } from "./routers/obrigacoes";
import { checklistRouter } from "./routers/checklist";
import { mensalidadesRouter } from "./routers/mensalidades";
import { alertasRouter } from "./routers/alertas";
import { adminRouter } from "./routers/admin";
import { notificacoesRouter } from "./routers/notificacoes";
import { notificacaoConfigsRouter } from "./routers/notificacaoConfigs";
import { servicosRouter } from "./routers/servicos";
import { documentosRouter } from "./routers/documentos";
import { fluxoCaixaRouter } from "./routers/fluxoCaixa";
import { acessosRouter } from "./routers/acessos";
import { z } from "zod";
import * as db from "./db";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { sdk } from "./_core/sdk";
import { notifyOwner } from "./_core/notification";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  clientes: clientesRouter,
  obrigacoes: obrigacoesRouter,
  checklist: checklistRouter,
  mensalidades: mensalidadesRouter,
  alertas: alertasRouter,
  admin: adminRouter,
  notificacoes: notificacoesRouter,
  notificacaoConfigs: router(notificacaoConfigsRouter),
  servicos: servicosRouter,
  documentos: documentosRouter,
  fluxoCaixa: fluxoCaixaRouter,
  acessos: acessosRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    register: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
        name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await db.createLocalUser(input.email, input.name, input.password);
          if (!user) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar usuário" });
          }

          // Criar sessão
          const sessionToken = await sdk.createSessionToken(user.openId || "", {
            name: user.name || "",
            expiresInMs: ONE_YEAR_MS,
          });

          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

          // Notificar admin
          try {
            const msg = `Novo usuario: ${user.name} (${user.email})`;
            await notifyOwner({
              title: "Novo usuario registrado",
              content: msg,
            });
          } catch (e) {
            console.warn("Notificacao falhou", e);
          }

          return { success: true, user };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "Erro ao registrar usuario",
          });
        }
      }),
    login: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(1, "Senha é obrigatória"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await db.verifyPassword(input.email, input.password);
          if (!user) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Email ou senha inválidos",
            });
          }

          if (user.status === 'pending') {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Sua conta ainda não foi aprovada. Aguarde a aprovação do administrador.",
            });
          }

          if (user.status === 'rejected') {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Sua conta foi rejeitada. Entre em contato com o administrador.",
            });
          }

          // Atualizar lastSignedIn
          await db.upsertUser({
            openId: user.openId,
            lastSignedIn: new Date(),
          });

          // Criar sessão
          const sessionToken = await sdk.createSessionToken(user.openId || "", {
            name: user.name || "",
            expiresInMs: ONE_YEAR_MS,
          });

          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

          return { success: true, user };
        } catch (error: any) {
          if (error instanceof TRPCError) {
            throw error;
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao fazer login",
          });
        }
      }),
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(1, "Senha atual é obrigatória"),
        newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await db.getUserByOpenId(ctx.user.openId || "");
          if (!user || !user.passwordHash) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Usuário não tem senha configurada",
            });
          }

          // Verificar senha atual
          const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
          if (!isValid) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Senha atual incorreta",
            });
          }

          // Hash da nova senha
          const newPasswordHash = await bcrypt.hash(input.newPassword, 10);

          // Atualizar senha
          await db.upsertUser({
            openId: user.openId,
            passwordHash: newPasswordHash,
          });

          return { success: true };
        } catch (error: any) {
          if (error instanceof TRPCError) {
            throw error;
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Erro ao alterar senha",
          });
        }
      }),
  }),
  users: router({
    getPending: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
      }
      return db.getPendingUsers();
    }),
    getAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
      }
      return db.getAllUsers();
    }),
    approve: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        return db.approveUser(input.userId);
      }),
    reject: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        return db.rejectUser(input.userId);
      }),
    deleteMany: protectedProcedure
      .input(z.object({ userIds: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        if (input.userIds.length === 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nenhum usuario selecionado' });
        }
        return db.deleteUsers(input.userIds);
      }),
  }),
  permissions: router({
    grantAccess: protectedProcedure
      .input(z.object({
        clienteId: z.number(),
        userId: z.number(),
        canView: z.boolean().default(true),
        canEdit: z.boolean().default(false),
        canDelete: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        return db.grantClienteAccess(input.clienteId, input.userId, input.canView, input.canEdit, input.canDelete);
      }),
    revokeAccess: protectedProcedure
      .input(z.object({ clienteId: z.number(), userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        return db.revokeClienteAccess(input.clienteId, input.userId);
      }),
    grantBulkAccess: protectedProcedure
      .input(z.object({
        clienteIds: z.array(z.number()).min(1),
        userId: z.number(),
        canView: z.boolean().default(true),
        canEdit: z.boolean().default(false),
        canDelete: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        await Promise.all(
          input.clienteIds.map((clienteId) =>
            db.grantClienteAccess(clienteId, input.userId, input.canView, input.canEdit, input.canDelete)
          )
        );
        return { success: true, count: input.clienteIds.length };
      }),
    getClientePermissions: protectedProcedure
      .input(z.object({ clienteId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        return db.getUsersWithClienteAccess(input.clienteId);
      }),
  }),
  audit: router({
    getByCliente: protectedProcedure
      .input(z.object({ clienteId: z.number(), limit: z.number().default(100) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        return db.getAuditLogByCliente(input.clienteId, input.limit);
      }),
    getByUser: protectedProcedure
      .input(z.object({ userId: z.number(), limit: z.number().default(100) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        return db.getAuditLogByUser(input.userId, input.limit);
      }),
    getAll: protectedProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        return db.getAllAuditLogs(input.limit);
      }),
  }),
  backup: router({
    getAllBackups: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        return db.getAllBackups();
      }),
    getBackupById: protectedProcedure
      .input(z.object({ clienteId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        return db.getBackupById(input.clienteId);
      }),
    restore: protectedProcedure
      .input(z.object({ clienteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        return db.restoreClienteFromBackup(input.clienteId);
      }),
    getSyncStats: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        return db.getSyncStats();
      }),
    getPendingSyncLogs: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        return db.getPendingSyncLogs();
      }),
    getFailedSyncLogs: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        return db.getFailedSyncLogs();
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
