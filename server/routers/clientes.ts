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
  regime: z.enum(["Simples", "Lucro Presumido", "Lucro Real", "MEI"]),
  setor: z.enum(["Fiscal", "Trabalhista", "Contábil", "Geral"]).optional(),
  valor: z.string().or(z.number()),
  vencimento: z.number().min(1).max(31),
  status: z.enum(["Ativo", "Inativo"]).optional(),
});

export const clientesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const clientes = await getClientesByUser(ctx.user.id);
    // Normalizar valor para número (MySQL DECIMAL retorna como string)
    return clientes.map((cliente: any) => ({
      ...cliente,
      valor: typeof cliente.valor === 'number' ? cliente.valor : Number(cliente.valor),
    }));
  }),

  create: protectedProcedure
    .input(clienteSchema)
    .mutation(async ({ ctx, input }) => {
      const valor = typeof input.valor === "string" ? parseFloat(input.valor) : input.valor;
      const result = await createCliente({
        userId: ctx.user.id,
        nome: input.nome,
        regime: input.regime,
        setor: input.setor || "Geral",
        valor: valor,
        vencimento: input.vencimento,
        status: input.status || "Ativo",
      });
      
      // Normalizar valor para número
      return {
        ...result,
        valor: typeof (result as any).valor === 'number' ? (result as any).valor : Number((result as any).valor),
      };
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

      const result = await updateCliente(input.id, {
        ...input.data,
        ...(valor !== undefined && { valor }),
      });
      
      // Normalizar valor para número
      return {
        ...result,
        valor: typeof (result as any).valor === 'number' ? (result as any).valor : Number((result as any).valor),
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const result = await deleteCliente(input.id);
      return {
        ...result,
        valor: typeof (result as any).valor === 'number' ? (result as any).valor : Number((result as any).valor),
      };
    }),

  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      if (input.ids.length === 0) {
        throw new Error('Nenhum cliente selecionado');
      }
      const deletados = [];
      for (const id of input.ids) {
        try {
          await deleteCliente(id);
          deletados.push(id);
        } catch (error) {
          console.error(`Erro ao deletar cliente ${id}:`, error);
        }
      }
      return {
        sucesso: true,
        mensagem: `${deletados.length} cliente(s) deletado(s)`,
        deletados,
      };
    }),
});
