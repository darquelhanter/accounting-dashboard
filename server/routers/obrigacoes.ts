import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getObrigacoesByUser,
  createObrigacao,
  updateObrigacao,
  deleteObrigacao,
} from "../db";

const obrigacaoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.enum(["Fiscal", "Acessória", "Trabalhista", "Outra"]),
  periodicidade: z.enum(["Mensal", "Anual", "Contínuo"]),
  regime: z.enum(["Simples", "Todos", "Com Funcionários"]),
  descricao: z.string().optional(),
  vencimento: z.number().optional(),
});

export const obrigacoesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getObrigacoesByUser(ctx.user.id);
  }),

  create: protectedProcedure
    .input(obrigacaoSchema)
    .mutation(async ({ ctx, input }) => {
      return createObrigacao({
        userId: ctx.user.id,
        nome: input.nome,
        categoria: input.categoria,
        periodicidade: input.periodicidade,
        regime: input.regime,
        descricao: input.descricao || null,
        vencimento: input.vencimento || null,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: obrigacaoSchema.partial(),
      })
    )
    .mutation(async ({ input }) => {
      return updateObrigacao(input.id, input.data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteObrigacao(input.id);
    }),
});
