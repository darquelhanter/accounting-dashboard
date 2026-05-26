import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getResponsaveisByUser, createResponsavel, updateResponsavel, deleteResponsavel } from "../db";

export const responsaveisRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getResponsaveisByUser(ctx.user.id, ctx.user.role === "admin");
  }),

  create: protectedProcedure
    .input(z.object({
      nome: z.string().min(1),
      email: z.string().email().optional().or(z.literal("")),
      telefone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createResponsavel({
        userId: ctx.user.id,
        nome: input.nome,
        email: input.email || null,
        telefone: input.telefone || null,
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      nome: z.string().min(1).optional(),
      email: z.string().email().optional().or(z.literal("")),
      telefone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return updateResponsavel(id, {
        ...(data.nome !== undefined && { nome: data.nome }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.telefone !== undefined && { telefone: data.telefone || null }),
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteResponsavel(input.id);
    }),
});
