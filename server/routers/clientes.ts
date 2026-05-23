import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getClientesByUser,
  getClientesByUserWithPermissions,
  createCliente,
  updateCliente,
  deleteCliente,
  linkObrigacoesToChecklistByRegime,
  linkObrigacoesByIds,
  logAuditAction,
  backupCliente,
  logSync,
  getAllBackups,
  getBackupById,
  restoreClienteFromBackup,
} from "../db";

const clienteSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  regime: z.enum(["Simples", "Lucro Presumido", "Lucro Real", "MEI"]),
  setor: z.enum(["Fiscal", "Trabalhista", "Contábil", "Geral"]).optional(),
  valor: z.string().or(z.number()),
  vencimento: z.number().min(1).max(31),
  status: z.enum(["Ativo", "Inativo"]).optional(),
  obrigacaoIds: z.array(z.number()).optional(),
});

export const clientesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const clientes = await getClientesByUserWithPermissions(ctx.user.id);
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
      
      const clienteId = (result as any)?.id;
      if (clienteId) {
        try {
          if (input.obrigacaoIds && input.obrigacaoIds.length > 0) {
            await linkObrigacoesByIds(clienteId, input.obrigacaoIds);
          } else if (input.obrigacaoIds === undefined) {
            // Compatibilidade: se não enviou obrigacaoIds, usa o comportamento antigo por regime
            await linkObrigacoesToChecklistByRegime(clienteId, input.regime);
          }
          // Se obrigacaoIds for array vazio, não vincula nenhuma obrigação
          console.log(`Obrigações vinculadas ao checklist para cliente ${clienteId}`);
          // Log auditoria
          await logAuditAction({
            userId: ctx.user.id,
            clienteId,
            action: "create",
            entityType: "cliente",
            entityId: clienteId,
            description: `Empresa criada: ${input.nome}`,
            changes: input,
          });
          
          // Fazer backup automático
          try {
            await backupCliente(clienteId);
            await logSync('cliente', clienteId, 'create', 'synced');
            console.log(`Backup realizado para cliente ${clienteId}`);
          } catch (backupError) {
            console.error("Erro ao fazer backup:", backupError);
            await logSync('cliente', clienteId, 'create', 'failed', String(backupError));
          }
        } catch (error) {
          console.error("Erro ao vincular obrigações ao checklist:", error);
        }
      }
      
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
    .mutation(async ({ ctx, input }) => {
      const valor = input.data.valor
        ? typeof input.data.valor === "string"
          ? parseFloat(input.data.valor)
          : input.data.valor
        : undefined;

      const result = await updateCliente(input.id, {
        ...input.data,
        ...(valor !== undefined && { valor }),
      });
      
      // Log auditoria
      await logAuditAction({
        userId: ctx.user.id,
        clienteId: input.id,
        action: "update",
        entityType: "cliente",
        entityId: input.id,
        description: `Empresa atualizada`,
        changes: input.data,
      });
      
      // Fazer backup automatico
      try {
        await backupCliente(input.id);
        await logSync('cliente', input.id, 'update', 'synced');
      } catch (backupError) {
        console.error("Erro ao fazer backup:", backupError);
        await logSync('cliente', input.id, 'update', 'failed', String(backupError));
      }
      
      // Normalizar valor para número
      return {
        ...result,
        valor: typeof (result as any).valor === 'number' ? (result as any).valor : Number((result as any).valor),
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const result = await deleteCliente(input.id);
      
      // Log auditoria
      await logAuditAction({
        userId: ctx.user.id,
        clienteId: input.id,
        action: "delete",
        entityType: "cliente",
        entityId: input.id,
        description: `Empresa deletada`,
      });
      
      // Fazer backup automatico antes de deletar
      try {
        await backupCliente(input.id);
        await logSync('cliente', input.id, 'delete', 'synced');
      } catch (backupError) {
        console.error("Erro ao fazer backup:", backupError);
        await logSync('cliente', input.id, 'delete', 'failed', String(backupError));
      }
      
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
