import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getClientesByUser,
  createCliente,
  updateCliente,
  deleteCliente,
} from "../db";

const clienteSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  regime: z.enum(["Simples", "Lucro Presumido", "Lucro Real"]),
  setor: z.enum(["Fiscal", "Trabalhista", "Contábil", "Geral"]).optional(),
  valor: z.string().or(z.number()),
  vencimento: z.number().min(1).max(31),
  status: z.enum(["Ativo", "Inativo"]).optional(),
});

export const clientesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getClientesByUser(ctx.user.id);
  }),

  create: protectedProcedure
    .input(clienteSchema)
    .mutation(async ({ ctx, input }) => {
      const valor = typeof input.valor === "string" ? parseFloat(input.valor) : input.valor;
      return createCliente({
        userId: ctx.user.id,
        nome: input.nome,
        regime: input.regime,
        setor: input.setor || "Geral",
        valor: valor,
        vencimento: input.vencimento,
        status: input.status || "Ativo",
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: clienteSchema.partial(),
      })
    )
    .mutation(async ({ input }) => {
      const valor = input.data.valor
        ? typeof input.data.valor === "string"
          ? parseFloat(input.data.valor)
          : input.data.valor
        : undefined;

      return updateCliente(input.id, {
        ...input.data,
        ...(valor !== undefined && { valor }),
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteCliente(input.id);
    }),
});
