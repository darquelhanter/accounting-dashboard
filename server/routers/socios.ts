import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getSociosByCliente, createSocio, updateSocio, deleteSocio } from "../db";

const socioSchema = z.object({
  clienteId: z.number(),
  nome: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().optional(),
  participacao: z.number().min(0).max(100).optional(),
  cargo: z.string().optional(),
});

export const sociosRouter = router({
  list: protectedProcedure
    .input(z.object({ clienteId: z.number() }))
    .query(async ({ ctx, input }) => {
      return getSociosByCliente(input.clienteId);
    }),

  create: protectedProcedure
    .input(socioSchema)
    .mutation(async ({ ctx, input }) => {
      return createSocio({ ...input, userId: ctx.user.id });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: socioSchema.partial() }))
    .mutation(async ({ input }) => {
      return updateSocio(input.id, input.data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteSocio(input.id);
    }),
});
