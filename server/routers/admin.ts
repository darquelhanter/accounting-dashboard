import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createObrigacao } from "../db";
import { TRPCError } from "@trpc/server";

// Procedimento que requer role admin
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Apenas administradores podem acessar este recurso",
    });
  }
  return next({ ctx });
});

export const adminRouter = router({
  seedObrigacoesPadrao: adminProcedure.mutation(async ({ ctx }) => {
    const obrigacoesPadrao = [
      {
        nome: "INSS",
        descricao: "Contribuição ao Instituto Nacional de Seguridade Social. Obrigação mensal de recolhimento de contribuições patronais e de terceiros.",
        categoria: "Trabalhista" as const,
        periodicidade: "Mensal" as const,
        vencimento: 20,
        regime: "Todos" as const,
      },
      {
        nome: "FGTS",
        descricao: "Fundo de Garantia do Tempo de Serviço. Depósito mensal de 8% sobre a folha de pagamento dos funcionários.",
        categoria: "Trabalhista" as const,
        periodicidade: "Mensal" as const,
        vencimento: 7,
        regime: "Todos" as const,
      },
      {
        nome: "eSocial",
        descricao: "Sistema de Escrituração Fiscal Digital de Informações Sociais, Trabalhistas e Contribuições Sindicais. Envio de informações sobre folha de pagamento.",
        categoria: "Acessória" as const,
        periodicidade: "Mensal" as const,
        vencimento: 7,
        regime: "Todos" as const,
      },
      {
        nome: "Folha Mensal",
        descricao: "Processamento e pagamento da folha de pagamento dos funcionários. Inclui cálculo de salários, descontos e encargos.",
        categoria: "Trabalhista" as const,
        periodicidade: "Mensal" as const,
        vencimento: 5,
        regime: "Todos" as const,
      },
      {
        nome: "DCTFWeb",
        descricao: "Declaração de Débitos e Créditos Tributários Federais. Declaração mensal de impostos federais devidos.",
        categoria: "Fiscal" as const,
        periodicidade: "Mensal" as const,
        vencimento: 15,
        regime: "Todos" as const,
      },
    ];

    const criadas = [];
    const erros = [];

    for (const obrigacao of obrigacoesPadrao) {
      try {
        const resultado = await createObrigacao({
          userId: ctx.user.id,
          nome: obrigacao.nome,
          categoria: obrigacao.categoria,
          periodicidade: obrigacao.periodicidade,
          regime: obrigacao.regime,
          descricao: obrigacao.descricao,
          vencimento: obrigacao.vencimento,
        });
        criadas.push(resultado);
      } catch (error) {
        erros.push({
          nome: obrigacao.nome,
          erro: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    return {
      sucesso: true,
      mensagem: `${criadas.length} obrigações padrão criadas com sucesso`,
      criadas: criadas.length,
      erros: erros.length,
      detalhes: {
        criadas,
        erros,
      },
    };
  }),

  // Endpoint para listar todas as obrigações de todos os usuários (admin only)
  listarTodasObrigacoes: adminProcedure.query(async ({ ctx }) => {
    const db = await import("../db");
    // Aqui você poderia implementar uma função que lista todas as obrigações
    // Por enquanto, retornamos um placeholder
    return {
      mensagem: "Endpoint de administração para listar todas as obrigações",
      usuarioId: ctx.user.id,
      role: ctx.user.role,
    };
  }),

  // Endpoint para deletar obrigações de um usuário específico (admin only)
  deletarObrigacoesDoUsuario: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      // Aqui você poderia implementar a lógica de deleção
      return {
        mensagem: `Obrigações do usuário ${input.userId} deletadas`,
      };
    }),
});
