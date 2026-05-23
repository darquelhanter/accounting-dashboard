import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getMensalidadesByUser,
  getMensalidadesByUserAndMonth,
  getMensalidadesByCliente,
  getMensalidadesByStatus,
  getMensalidadesPendentes,
  getTotalMensalidadesByUser,
  createMensalidade,
  updateMensalidade,
  deleteMensalidade,
} from "../db";

export const mensalidadesRouter = router({
  // Listar todas as mensalidades do usuário
  list: protectedProcedure.query(async ({ ctx }) => {
    return getMensalidadesByUser(ctx.user.id, ctx.user.role === 'admin');
  }),

  // Listar mensalidades por mês e ano
  listByMonth: protectedProcedure
    .input(
      z.object({
        mes: z.string(),
        ano: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getMensalidadesByUserAndMonth(ctx.user.id, input.mes, input.ano, ctx.user.role === 'admin');
    }),

  // Listar mensalidades por cliente
  listByCliente: protectedProcedure
    .input(
      z.object({
        clienteId: z.number(),
        mes: z.string().optional(),
        ano: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return getMensalidadesByCliente(input.clienteId, input.mes, input.ano);
    }),

  // Listar mensalidades por status
  listByStatus: protectedProcedure
    .input(
      z.object({
        status: z.enum(["Pago", "Pendente", "Atrasado"]),
      })
    )
    .query(async ({ ctx, input }) => {
      return getMensalidadesByStatus(ctx.user.id, input.status, ctx.user.role === 'admin');
    }),

  // Listar mensalidades pendentes e atrasadas
  listPendentes: protectedProcedure.query(async ({ ctx }) => {
    return getMensalidadesPendentes(ctx.user.id, ctx.user.role === 'admin');
  }),

  // Obter totais de mensalidades
  getTotals: protectedProcedure.query(async ({ ctx }) => {
    return getTotalMensalidadesByUser(ctx.user.id, ctx.user.role === 'admin');
  }),

  // Criar mensalidade
  create: protectedProcedure
    .input(
      z.object({
        clienteId: z.number(),
        mes: z.string(),
        ano: z.number(),
        valor: z.string(),
        status: z.enum(["Pago", "Pendente", "Atrasado"]).default("Pendente"),
        dataPagamento: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createMensalidade({
        userId: ctx.user.id,
        clienteId: input.clienteId,
        mes: input.mes,
        ano: input.ano,
        valor: input.valor,
        status: input.status,
        dataPagamento: input.dataPagamento,
      });
    }),

  // Atualizar mensalidade
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["Pago", "Pendente", "Atrasado"]).optional(),
        valor: z.string().optional(),
        dataPagamento: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updateData: any = {};
      if (input.status) updateData.status = input.status;
      if (input.valor) updateData.valor = input.valor;
      if (input.dataPagamento) updateData.dataPagamento = input.dataPagamento;
      if (Object.keys(updateData).length === 0) {
        throw new Error("No fields to update");
      }
      return updateMensalidade(input.id, updateData);
    }),

  // Deletar mensalidade
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteMensalidade(input.id);
    }),

  // Marcar como pago
  markAsPaid: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        dataPagamento: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return updateMensalidade(input.id, {
        status: "Pago",
        dataPagamento: input.dataPagamento || new Date(),
      });
    }),

  // Marcar como atrasado
  markAsOverdue: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return updateMensalidade(input.id, {
        status: "Atrasado",
      });
    }),

  // Deletar múltiplas mensalidades
  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      return Promise.all(input.ids.map((id) => deleteMensalidade(id)));
    }),
});
