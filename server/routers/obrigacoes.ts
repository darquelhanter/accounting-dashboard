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
  regime: z.enum(["Simples", "Todos", "Com Funcionários", "MEI"]),
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

  seedPadrao: protectedProcedure.mutation(async ({ ctx }) => {
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
        console.log(`Obrigacao ${obrigacao.nome} pode ja existir`);
      }
    }

    return {
      sucesso: true,
      mensagem: `${criadas.length} obrigacoes padrao criadas`,
      obrigacoes: criadas,
    };
  }),
});
