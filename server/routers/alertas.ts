import { router, protectedProcedure } from "../_core/trpc";
import {
  getObrigacoesProximasVencimento,
  getMensalidadesAtrasadas,
  getMensalidadesPendentesProximas,
  getAlertasSumario,
  getKpisData,
} from "../db";

export const alertasRouter = router({
  // Obter obrigações próximas do vencimento
  obrigacoesProximas: protectedProcedure
    .input((val: any) => ({
      diasAntecedencia: typeof val?.diasAntecedencia === 'number' ? val.diasAntecedencia : 7,
    }))
    .query(async ({ ctx, input }) => {
      return getObrigacoesProximasVencimento(ctx.user.id, input.diasAntecedencia, ctx.user.role === 'admin');
    }),

  // Obter mensalidades atrasadas
  mensalidadesAtrasadas: protectedProcedure.query(async ({ ctx }) => {
    return getMensalidadesAtrasadas(ctx.user.id, ctx.user.role === 'admin');
  }),

  // Obter mensalidades pendentes próximas
  mensalidadesPendentes: protectedProcedure
    .input((val: any) => ({
      diasAntecedencia: typeof val?.diasAntecedencia === 'number' ? val.diasAntecedencia : 3,
    }))
    .query(async ({ ctx, input }) => {
      return getMensalidadesPendentesProximas(ctx.user.id, input.diasAntecedencia, ctx.user.role === 'admin');
    }),

  // Obter sumário de alertas
  sumario: protectedProcedure.query(async ({ ctx }) => {
    return getAlertasSumario(ctx.user.id, ctx.user.role === 'admin');
  }),

  // Obter KPIs para a Home
  kpis: protectedProcedure.query(async ({ ctx }) => {
    return getKpisData(ctx.user.id, ctx.user.role === 'admin');
  }),

  // Obter detalhes de obrigações próximas com informações de cliente
  obrigacoesProximasDetalhes: protectedProcedure
    .input((val: any) => ({
      diasAntecedencia: typeof val?.diasAntecedencia === 'number' ? val.diasAntecedencia : 7,
    }))
    .query(async ({ ctx, input }) => {
      return getObrigacoesProximasVencimento(ctx.user.id, input.diasAntecedencia, ctx.user.role === 'admin');
    }),
});
