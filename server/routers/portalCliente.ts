import { PORTAL_COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "../_core/cookies";
import { adminProcedure, clientePortalProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { sdk } from "../_core/sdk";
import * as db from "../db";

export const portalClienteRouter = router({
  login: publicProcedure
    .input(z.object({
      cnpj: z.string().min(1, "CNPJ é obrigatório"),
      password: z.string().min(1, "Senha é obrigatória"),
      rememberMe: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      // Tenta com CNPJ formatado; se não achar, tenta só dígitos
      let portal = await db.verifyPortalClientePassword(input.cnpj, input.password);
      if (!portal) {
        const cnpjDigits = input.cnpj.replace(/\D/g, "");
        portal = await db.verifyPortalClientePassword(cnpjDigits, input.password);
      }

      if (!portal) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "CNPJ ou senha inválidos" });
      }

      const cookieOptions = getSessionCookieOptions(ctx.req);
      const expiresInMs = input.rememberMe ? ONE_YEAR_MS : undefined;
      const token = await sdk.createPortalToken(portal.clienteId, portal.cnpj, { expiresInMs });

      ctx.res.cookie(PORTAL_COOKIE_NAME, token, {
        ...cookieOptions,
        ...(input.rememberMe ? { maxAge: ONE_YEAR_MS } : {}),
      });

      const cliente = await db.getClienteById(portal.clienteId);
      return { success: true, clienteId: portal.clienteId, cnpj: portal.cnpj, nomeEmpresa: cliente?.nome ?? "" };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(PORTAL_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.clientePortal) return null;
    const cliente = await db.getClienteById(ctx.clientePortal.clienteId);
    if (!cliente) return null;
    return {
      clienteId: ctx.clientePortal.clienteId,
      cnpj: ctx.clientePortal.cnpj,
      nomeEmpresa: cliente.nome,
    };
  }),

  documentos: clientePortalProcedure.query(async ({ ctx }) => {
    return db.getDocumentosByCliente(ctx.clientePortal.clienteId);
  }),

  downloadDocumento: clientePortalProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const doc = await db.getDocumentoConteudo(input.id);
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Documento não encontrado" });
      if (doc.clienteId !== ctx.clientePortal.clienteId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      return doc;
    }),

  uploadDocumento: clientePortalProcedure
    .input(z.object({
      pasta: z.string().optional(),
      nome: z.string().min(1),
      descricao: z.string().optional(),
      tipo: z.string().min(1),
      tamanho: z.number().int().positive(),
      conteudo: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.createDocumento({
        userId: 0,
        clienteId: ctx.clientePortal.clienteId,
        pasta: input.pasta ?? null,
        nome: input.nome,
        descricao: input.descricao ?? null,
        tipo: input.tipo,
        tamanho: input.tamanho,
        conteudo: input.conteudo,
      });
      return { success: true };
    }),

  deleteDocumento: clientePortalProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const doc = await db.getDocumentoConteudo(input.id);
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Documento não encontrado" });
      if (doc.clienteId !== ctx.clientePortal.clienteId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      await db.deleteDocumento(input.id);
      return { success: true };
    }),

  fluxoCaixa: clientePortalProcedure.query(async ({ ctx }) => {
    const [mensalidades, servicos, lancamentos] = await Promise.all([
      db.getMensalidadesByCliente(ctx.clientePortal.clienteId),
      db.getServicosPrestadosByCliente(ctx.clientePortal.clienteId),
      db.getPortalFluxoCaixaByCliente(ctx.clientePortal.clienteId),
    ]);
    return { mensalidades, servicos, lancamentos };
  }),

  criarLancamento: clientePortalProcedure
    .input(z.object({
      tipo: z.enum(["entrada", "saida"]),
      descricao: z.string().min(1, "Descrição é obrigatória"),
      valor: z.number().positive("Valor deve ser positivo"),
      mes: z.string().min(1),
      ano: z.number().int().min(2000).max(2100),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.createPortalFluxoCaixa({
        clienteId: ctx.clientePortal.clienteId,
        tipo: input.tipo,
        descricao: input.descricao,
        valor: input.valor.toFixed(2),
        mes: input.mes,
        ano: input.ano,
      });
      return { success: true };
    }),

  deletarLancamento: clientePortalProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db.deletePortalFluxoCaixa(input.id, ctx.clientePortal.clienteId);
      return { success: true };
    }),
});

// Roteador admin para gerenciar acesso do portal
export const portalAdminRouter = router({
  getByCliente: protectedProcedure
    .input(z.object({ clienteId: z.number() }))
    .query(async ({ input }) => {
      const portal = await db.getPortalClienteByClienteId(input.clienteId);
      if (!portal) return null;
      const { passwordHash: _, ...rest } = portal;
      return rest;
    }),

  create: adminProcedure
    .input(z.object({
      clienteId: z.number(),
      cnpj: z.string().min(1),
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    }))
    .mutation(async ({ input }) => {
      try {
        const portal = await db.createPortalCliente(input.clienteId, input.cnpj, input.password);
        if (!portal) throw new Error("Falha ao criar acesso");
        const { passwordHash: _, ...rest } = portal;
        return rest;
      } catch (error: any) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error.message || "Erro ao criar acesso" });
      }
    }),

  updatePassword: adminProcedure
    .input(z.object({
      clienteId: z.number(),
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    }))
    .mutation(async ({ input }) => {
      await db.updatePortalClientePassword(input.clienteId, input.password);
      return { success: true };
    }),

  toggle: adminProcedure
    .input(z.object({ clienteId: z.number(), ativo: z.boolean() }))
    .mutation(async ({ input }) => {
      await db.togglePortalCliente(input.clienteId, input.ativo);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ clienteId: z.number() }))
    .mutation(async ({ input }) => {
      await db.deletePortalCliente(input.clienteId);
      return { success: true };
    }),
});
