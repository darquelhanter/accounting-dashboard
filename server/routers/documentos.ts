import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getDocumentosByUser,
  getDocumentosByCliente,
  getDocumentoConteudo,
  createDocumento,
  deleteDocumento,
  renamePastaDocumentos,
  renameDocumentoNome,
  getPastasDescricoes,
  upsertPastaDescricao,
  deletePastaDescricao,
  deletePastaDescricoesByPrefix,
} from "../db";

export const documentosRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getDocumentosByUser(ctx.user.id, ctx.user.role === "admin");
  }),

  listByCliente: protectedProcedure
    .input(z.object({ clienteId: z.number() }))
    .query(async ({ input }) => {
      return getDocumentosByCliente(input.clienteId);
    }),

  upload: protectedProcedure
    .input(
      z.object({
        clienteId: z.number(),
        pasta: z.string().optional(),
        nome: z.string().min(1),
        descricao: z.string().optional(),
        tipo: z.string(),
        tamanho: z.number(),
        conteudo: z.string(), // base64 data URL
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createDocumento({
        userId: ctx.user.id,
        clienteId: input.clienteId,
        pasta: input.pasta ?? null,
        nome: input.nome,
        descricao: input.descricao ?? null,
        tipo: input.tipo,
        tamanho: input.tamanho,
        conteudo: input.conteudo,
      });
    }),

  download: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const doc = await getDocumentoConteudo(input.id);
      if (!doc) throw new Error("Documento não encontrado");
      return doc;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteDocumento(input.id);
    }),

  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      return Promise.all(input.ids.map((id) => deleteDocumento(id)));
    }),

  renamePasta: protectedProcedure
    .input(z.object({
      clienteId: z.number(),
      oldNome: z.string().min(1),
      newNome: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      return renamePastaDocumentos(input.clienteId, input.oldNome, input.newNome);
    }),

  renameDocumento: protectedProcedure
    .input(z.object({ id: z.number(), nome: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return renameDocumentoNome(input.id, input.nome);
    }),

  getPastasDescricoes: protectedProcedure
    .input(z.object({ clienteId: z.number() }))
    .query(async ({ input }) => {
      return getPastasDescricoes(input.clienteId);
    }),

  upsertPastaDescricao: protectedProcedure
    .input(z.object({
      clienteId: z.number(),
      path: z.string().min(1),
      descricao: z.string(),
    }))
    .mutation(async ({ input }) => {
      if (input.descricao.trim()) {
        await upsertPastaDescricao(input.clienteId, input.path, input.descricao.trim());
      } else {
        await deletePastaDescricao(input.clienteId, input.path);
      }
      return { success: true };
    }),

  deletePastaDescricao: protectedProcedure
    .input(z.object({ clienteId: z.number(), path: z.string() }))
    .mutation(async ({ input }) => {
      await deletePastaDescricoesByPrefix(input.clienteId, input.path);
      return { success: true };
    }),
});
