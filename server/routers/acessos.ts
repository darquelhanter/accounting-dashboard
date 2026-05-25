import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getAcessosByUser, getAcessosByCliente, createAcesso, updateAcesso, deleteAcesso } from "../db";

export const acessosRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getAcessosByUser(ctx.user.id, ctx.user.role === "admin");
  }),

  listByCliente: protectedProcedure
    .input(z.object({ clienteId: z.number() }))
    .query(async ({ input }) => {
      return getAcessosByCliente(input.clienteId);
    }),

  create: protectedProcedure
    .input(z.object({
      clienteId: z.number(),
      descricao: z.string().min(1),
      email: z.string().optional(),
      senha: z.string().optional(),
      telefone: z.string().optional(),
      observacao: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createAcesso({
        userId: ctx.user.id,
        clienteId: input.clienteId,
        descricao: input.descricao,
        email: input.email ?? null,
        senha: input.senha ?? null,
        telefone: input.telefone ?? null,
        observacao: input.observacao ?? null,
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      descricao: z.string().optional(),
      email: z.string().optional(),
      senha: z.string().optional(),
      telefone: z.string().optional(),
      observacao: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...rest } = input;
      const data: any = {};
      if (rest.descricao !== undefined) data.descricao = rest.descricao;
      if (rest.email !== undefined) data.email = rest.email;
      if (rest.senha !== undefined) data.senha = rest.senha;
      if (rest.telefone !== undefined) data.telefone = rest.telefone;
      if (rest.observacao !== undefined) data.observacao = rest.observacao;
      return updateAcesso(id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteAcesso(input.id);
    }),

  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      return Promise.all(input.ids.map((id) => deleteAcesso(id)));
    }),
});
