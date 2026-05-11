import { protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getNotificacaoConfig, createNotificacaoConfig, updateNotificacaoConfig, deleteNotificacaoConfig } from "../db";
import { TRPCError } from "@trpc/server";

export const notificacaoConfigsRouter = {
  // Obter configuração de notificações do usuário
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    try {
      const config = await getNotificacaoConfig(ctx.user.id);
      
      // Se não existe, criar com valores padrão
      if (!config) {
        await createNotificacaoConfig({
          userId: ctx.user.id,
          ativarMensalidades: true,
          diasAntecedencia: 3,
          ativarObrigacoes: true,
          ativarChecklist: true,
          horarioEnvio: "09:00",
          frequencia: "Diaria",
          ativo: true,
        });
        
        return {
          userId: ctx.user.id,
          ativarMensalidades: true,
          diasAntecedencia: 3,
          ativarObrigacoes: true,
          ativarChecklist: true,
          horarioEnvio: "09:00",
          frequencia: "Diaria",
          ativo: true,
        };
      }
      
      return config;
    } catch (error) {
      console.error("Erro ao obter configuração de notificações:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao obter configuração de notificações",
      });
    }
  }),

  // Atualizar configuração de notificações
  updateConfig: protectedProcedure
    .input(
      z.object({
        ativarMensalidades: z.boolean().optional(),
        diasAntecedencia: z.number().min(1).max(30).optional(),
        ativarObrigacoes: z.boolean().optional(),
        ativarChecklist: z.boolean().optional(),
        horarioEnvio: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        frequencia: z.enum(["Diaria", "Semanal", "Mensal"]).optional(),
        ativo: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verificar se já existe configuração
        const existingConfig = await getNotificacaoConfig(ctx.user.id);
        
        if (!existingConfig) {
          // Criar nova configuração
          await createNotificacaoConfig({
            userId: ctx.user.id,
            ...input,
            ativarMensalidades: input.ativarMensalidades ?? true,
            diasAntecedencia: input.diasAntecedencia ?? 3,
            ativarObrigacoes: input.ativarObrigacoes ?? true,
            ativarChecklist: input.ativarChecklist ?? true,
            horarioEnvio: input.horarioEnvio ?? "09:00",
            frequencia: input.frequencia ?? "Diaria",
            ativo: input.ativo ?? true,
          });
        } else {
          // Atualizar configuração existente
          await updateNotificacaoConfig(ctx.user.id, {
            ...input,
            updatedAt: new Date(),
          });
        }
        
        return { success: true, message: "Configuração atualizada com sucesso" };
      } catch (error) {
        console.error("Erro ao atualizar configuração de notificações:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar configuração de notificações",
        });
      }
    }),

  // Ativar/desativar notificações
  toggleNotifications: protectedProcedure
    .input(z.object({ ativo: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const existingConfig = await getNotificacaoConfig(ctx.user.id);
        
        if (!existingConfig) {
          await createNotificacaoConfig({
            userId: ctx.user.id,
            ativo: input.ativo,
            ativarMensalidades: true,
            diasAntecedencia: 3,
            ativarObrigacoes: true,
            ativarChecklist: true,
            horarioEnvio: "09:00",
            frequencia: "Diaria",
          });
        } else {
          await updateNotificacaoConfig(ctx.user.id, {
            ativo: input.ativo,
            updatedAt: new Date(),
          });
        }
        
        return { success: true, ativo: input.ativo };
      } catch (error) {
        console.error("Erro ao alternar notificações:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao alternar notificações",
        });
      }
    }),

  // Redefinir configurações para padrão
  resetToDefault: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await updateNotificacaoConfig(ctx.user.id, {
        ativarMensalidades: true,
        diasAntecedencia: 3,
        ativarObrigacoes: true,
        ativarChecklist: true,
        horarioEnvio: "09:00",
        frequencia: "Diaria",
        ativo: true,
        updatedAt: new Date(),
      });
      
      return { success: true, message: "Configurações redefinidas para padrão" };
    } catch (error) {
      console.error("Erro ao redefinir configurações:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao redefinir configurações",
      });
    }
  }),
};
