import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getServicosPrestadosByUser,
  getServicosPrestadosByUserAndMonth,
  createServicoPrestado,
  updateServicoPrestado,
  deleteServicoPrestado,
} from "../db";

export const servicosRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getServicosPrestadosByUser(ctx.user.id, ctx.user.role === "admin");
  }),

  listByMonth: protectedProcedure
    .input(z.object({ mes: z.string(), ano: z.number() }))
    .query(async ({ ctx, input }) => {
      return getServicosPrestadosByUserAndMonth(ctx.user.id, input.mes, input.ano, ctx.user.role === "admin");
    }),

  create: protectedProcedure
    .input(
      z.object({
        clienteId: z.number(),
        nomeServico: z.string().min(1),
        descricao: z.string().optional(),
        valor: z.string(),
        mes: z.string(),
        ano: z.number(),
        status: z.enum(["Pago", "Pendente", "Atrasado"]).default("Pendente"),
        dataPagamento: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createServicoPrestado({
        userId: ctx.user.id,
        clienteId: input.clienteId,
        nomeServico: input.nomeServico,
        descricao: input.descricao ?? null,
        valor: input.valor,
        mes: input.mes,
        ano: input.ano,
        status: input.status,
        dataPagamento: input.dataPagamento ?? null,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        nomeServico: z.string().optional(),
        descricao: z.string().optional(),
        valor: z.string().optional(),
        mes: z.string().optional(),
        ano: z.number().optional(),
        status: z.enum(["Pago", "Pendente", "Atrasado"]).optional(),
        dataPagamento: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...rest } = input;
      const data: any = {};
      if (rest.nomeServico !== undefined) data.nomeServico = rest.nomeServico;
      if (rest.descricao !== undefined) data.descricao = rest.descricao;
      if (rest.valor !== undefined) data.valor = rest.valor;
      if (rest.mes !== undefined) data.mes = rest.mes;
      if (rest.ano !== undefined) data.ano = rest.ano;
      if (rest.status !== undefined) data.status = rest.status;
      if (rest.dataPagamento !== undefined) data.dataPagamento = rest.dataPagamento;
      return updateServicoPrestado(id, data);
    }),

  markAsPaid: protectedProcedure
    .input(z.object({ id: z.number(), dataPagamento: z.date().optional() }))
    .mutation(async ({ input }) => {
      return updateServicoPrestado(input.id, {
        status: "Pago",
        dataPagamento: input.dataPagamento || new Date(),
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteServicoPrestado(input.id);
    }),

  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      return Promise.all(input.ids.map((id) => deleteServicoPrestado(id)));
    }),
});
