import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getChecklistByUserAndMonth,
  getChecklistByCliente,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from "../db";

const checklistItemSchema = z.object({
  clienteId: z.number(),
  obrigacaoId: z.number(),
  mes: z.string(),
  ano: z.number(),
  status: z.enum(["Feito", "Pendente", "Em Progresso", "Bloqueado", "N/A"]),
  responsavel: z.string().optional(),
  horaInicial: z.string().optional(),
  horaFinal: z.string().optional(),
  totalHoras: z.number().optional(),
});

export const checklistRouter = router({
  listByMonth: protectedProcedure
    .input(
      z.object({
        mes: z.string(),
        ano: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getChecklistByUserAndMonth(ctx.user.id, input.mes, input.ano);
    }),

  listByCliente: protectedProcedure
    .input(
      z.object({
        clienteId: z.number(),
        mes: z.string(),
        ano: z.number(),
      })
    )
    .query(async ({ input }) => {
      return getChecklistByCliente(input.clienteId, input.mes, input.ano);
    }),

  create: protectedProcedure
    .input(checklistItemSchema)
    .mutation(async ({ ctx, input }) => {
      return createChecklistItem({
        userId: ctx.user.id,
        clienteId: input.clienteId,
        obrigacaoId: input.obrigacaoId,
        mes: input.mes,
        ano: input.ano,
        status: input.status,
        responsavel: input.responsavel || null,
        horaInicial: input.horaInicial || null,
        horaFinal: input.horaFinal || null,
        totalHoras: input.totalHoras || null,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: checklistItemSchema.partial(),
      })
    )
    .mutation(async ({ input }) => {
      return updateChecklistItem(input.id, input.data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteChecklistItem(input.id);
    }),

  bulkCreate: protectedProcedure
    .input(
      z.object({
        clienteId: z.number(),
        obrigacaoIds: z.array(z.number()),
        mes: z.string(),
        ano: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const items = input.obrigacaoIds.map((obrigacaoId) => ({
        userId: ctx.user.id,
        clienteId: input.clienteId,
        obrigacaoId,
        mes: input.mes,
        ano: input.ano,
        status: "Pendente" as const,
      }));

      return Promise.all(items.map((item) => createChecklistItem(item)));
    }),
});
