import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getFluxoCaixaSummary,
  getFluxoCaixaAnual,
  getFluxoCaixaTransacoes,
} from "../db";

export const fluxoCaixaRouter = router({
  getSummary: protectedProcedure
    .input(z.object({ mes: z.string(), ano: z.number() }))
    .query(async ({ ctx, input }) => {
      return getFluxoCaixaSummary(ctx.user.id, input.mes, input.ano, ctx.user.role === "admin");
    }),

  getAnual: protectedProcedure
    .input(z.object({ ano: z.number() }))
    .query(async ({ ctx, input }) => {
      return getFluxoCaixaAnual(ctx.user.id, input.ano, ctx.user.role === "admin");
    }),

  getTransacoes: protectedProcedure
    .input(z.object({ mes: z.string(), ano: z.number() }))
    .query(async ({ ctx, input }) => {
      return getFluxoCaixaTransacoes(ctx.user.id, input.mes, input.ano, ctx.user.role === "admin");
    }),
});
