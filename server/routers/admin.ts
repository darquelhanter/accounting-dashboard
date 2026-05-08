import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createObrigacao, getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { users, clientes, obrigacoes, checklistObrigacoes, controleMensalidades } from "../../drizzle/schema";
import { eq, count } from "drizzle-orm";

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
  // Listar todos os usuários do sistema
  listarUsuarios: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados não disponível",
      });
    }

    try {
      const allUsers = await db.select().from(users);
      
      // Enriquecer com estatísticas
      const usuariosComStats = await Promise.all(
        allUsers.map(async (user) => {
          const clientesCount = await db
            .select({ count: count() as any })
            .from(clientes)
            .where(eq(clientes.userId, user.id));
          
          const obrigacoesCount = await db
            .select({ count: count() as any })
            .from(obrigacoes)
            .where(eq(obrigacoes.userId, user.id));
          
          return {
            ...user,
            clientesCount: clientesCount[0]?.count || 0,
            obrigacoesCount: obrigacoesCount[0]?.count || 0,
          };
        })
      );

      return {
        sucesso: true,
        total: usuariosComStats.length,
        usuarios: usuariosComStats,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao listar usuários",
      });
    }
  }),

  // Alterar role de um usuário
  alterarRoleUsuario: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        novaRole: z.enum(["user", "admin"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      // Validação: não permitir remover admin de si mesmo
      if (String(input.userId) === String(ctx.user.id) && input.novaRole === "user") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Você não pode remover suas próprias permissões de admin",
        });
      }

      try {
        await db
          .update(users)
          .set({ role: input.novaRole })
          .where(eq(users.id, parseInt(input.userId)));

        return {
          sucesso: true,
          mensagem: `Role do usuário alterada para ${input.novaRole}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao alterar role",
        });
      }
    }),

  // Deletar usuário e todos seus dados
  deletarUsuario: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      // Validação: não permitir deletar a si mesmo
      if (String(input.userId) === String(ctx.user.id)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Você não pode deletar sua própria conta",
        });
      }

      try {
        // Deletar em cascata: checklist -> mensalidades -> obrigações -> clientes -> usuário
        const userClientes = await db
          .select({ id: clientes.id })
          .from(clientes)
          .where(eq(clientes.userId, parseInt(input.userId)));

        // Deletar checklist items e mensalidades para cada cliente
        for (const cliente of userClientes) {
          await db
            .delete(checklistObrigacoes)
            .where(eq(checklistObrigacoes.clienteId, cliente.id));

          await db
            .delete(controleMensalidades)
            .where(eq(controleMensalidades.clienteId, cliente.id));
        }

        // Deletar obrigações
        await db
          .delete(obrigacoes)
          .where(eq(obrigacoes.userId, parseInt(input.userId)));

        // Deletar clientes
        await db
          .delete(clientes)
          .where(eq(clientes.userId, parseInt(input.userId)));

        // Deletar usuário
        await db.delete(users).where(eq(users.id, parseInt(input.userId)));

        return {
          sucesso: true,
          mensagem: "Usuário e todos seus dados foram deletados",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao deletar usuário",
        });
      }
    }),

  // Seed de obrigações padrão para um usuário
  seedObrigacoesPadrao: adminProcedure
    .input(z.object({ userId: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const targetUserId = input.userId || ctx.user.id;

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
            userId: targetUserId,
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

  // Obter estatísticas gerais do sistema
  obterEstatisticas: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Banco de dados não disponível",
      });
    }

    try {
      const totalUsuarios = await db
        .select({ count: count() as any })
        .from(users);

      const totalClientes = await db
        .select({ count: count() as any })
        .from(clientes);

      const totalObrigacoes = await db
        .select({ count: count() as any })
        .from(obrigacoes);

      const totalChecklistItems = await db
        .select({ count: count() as any })
        .from(checklistObrigacoes);

      const totalMensalidades = await db
        .select({ count: count() as any })
        .from(controleMensalidades);

      return {
        sucesso: true,
        estatisticas: {
          totalUsuarios: totalUsuarios[0]?.count || 0,
          totalClientes: totalClientes[0]?.count || 0,
          totalObrigacoes: totalObrigacoes[0]?.count || 0,
          totalChecklistItems: totalChecklistItems[0]?.count || 0,
          totalMensalidades: totalMensalidades[0]?.count || 0,
        },
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao obter estatísticas",
      });
    }
  }),

  // Limpar dados de um usuário (sem deletar a conta)
  limparDadosUsuario: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Banco de dados não disponível",
        });
      }

      try {
        // Deletar em cascata
        const userClientes = await db
          .select({ id: clientes.id })
          .from(clientes)
          .where(eq(clientes.userId, parseInt(input.userId)));

        // Deletar checklist items e mensalidades para cada cliente
        for (const cliente of userClientes) {
          await db
            .delete(checklistObrigacoes)
            .where(eq(checklistObrigacoes.clienteId, cliente.id));

          await db
            .delete(controleMensalidades)
            .where(eq(controleMensalidades.clienteId, cliente.id));
        }

        await db
          .delete(obrigacoes)
          .where(eq(obrigacoes.userId, parseInt(input.userId)));

        await db
          .delete(clientes)
          .where(eq(clientes.userId, parseInt(input.userId)));

        return {
          sucesso: true,
          mensagem: "Dados do usuário foram limpos com sucesso",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao limpar dados",
        });
      }
    }),
});
