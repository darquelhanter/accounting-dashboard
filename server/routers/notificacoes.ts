import { protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import {
  sendNotificationEmail,
  getObrigacaoVencimentoTemplate,
  getMensalidadeAtrasadaTemplate,
  getChecklistPendenteTemplate,
} from '../services/emailService';
import { clientes, obrigacoes, controleMensalidades, checklistObrigacoes } from '../../drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export const notificacoesRouter = {
  /**
   * Enviar notificações de obrigações próximas do vencimento
   */
  enviarAlertsObrigacoes: protectedProcedure
    .input(z.object({ diasAntecedencia: z.number().default(7) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) return { sucesso: false, enviados: 0, total: 0, erro: 'Database not available' };

        // Buscar obrigações do usuário
        const obrigacoesUsuario = await db
          .select({
            id: obrigacoes.id,
            nome: obrigacoes.nome,
            vencimento: obrigacoes.vencimento,
            userId: obrigacoes.userId,
          })
          .from(obrigacoes)
          .where(eq(obrigacoes.userId, ctx.user.id));

        // Filtrar obrigações próximas do vencimento (baseado no dia do mês)
        const hoje = new Date();
        const diaHoje = hoje.getDate();
        const obrigacoesProximas = obrigacoesUsuario.filter(obr => {
          if (!obr.vencimento) return false;
          const diasParaVencimento = obr.vencimento - diaHoje;
          return diasParaVencimento > 0 && diasParaVencimento <= input.diasAntecedencia;
        });

        let enviados = 0;
        for (const obrigacao of obrigacoesProximas) {
          // Buscar email do usuário
          const userData = await db
            .select({ email: clientes.email })
            .from(clientes)
            .where(eq(clientes.userId, obrigacao.userId))
            .limit(1);

          const userEmail = userData[0]?.email;
          if (!userEmail) continue;

          const diasParaVencimento = obrigacao.vencimento! - diaHoje;
          const dataVencimento = new Date(hoje.getFullYear(), hoje.getMonth(), obrigacao.vencimento!);

          const html = getObrigacaoVencimentoTemplate(
            'Cliente',
            obrigacao.nome,
            diasParaVencimento,
            dataVencimento
          );

          const sucesso = await sendNotificationEmail({
            from: process.env.SMTP_FROM || 'noreply@accounting-dashboard.com',
            to: userEmail,
            subject: `⚠️ Alerta: ${obrigacao.nome} vence em ${diasParaVencimento} dias`,
            html,
          });

          if (sucesso) enviados++;
        }

        return { sucesso: true, enviados, total: obrigacoesProximas.length };
      } catch (error) {
        console.error('Erro ao enviar alertas de obrigações:', error);
        return { sucesso: false, enviados: 0, total: 0, erro: String(error) };
      }
    }),

  /**
   * Enviar notificações de mensalidades atrasadas
   */
  enviarAlertsMensalidades: protectedProcedure
    .input(z.object({ diasAtrasado: z.number().default(1) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) return { sucesso: false, enviados: 0, total: 0, erro: 'Database not available' };

        const hoje = new Date();
        const dataLimite = new Date(hoje.getTime() - input.diasAtrasado * 24 * 60 * 60 * 1000);

        // Buscar mensalidades atrasadas do usuário
        const mensalidadesAtrasadas = await db
          .select({
            id: controleMensalidades.id,
            valor: controleMensalidades.valor,
            dataPagamento: controleMensalidades.dataPagamento,
            mes: controleMensalidades.mes,
            ano: controleMensalidades.ano,
            clienteId: controleMensalidades.clienteId,
            clienteNome: clientes.nome,
          })
          .from(controleMensalidades)
          .innerJoin(clientes, eq(controleMensalidades.clienteId, clientes.id))
          .where(
            and(
              eq(controleMensalidades.userId, ctx.user.id),
              eq(controleMensalidades.status, 'Pendente'),
              lte(controleMensalidades.createdAt, dataLimite)
            )
          );

        let enviados = 0;
        for (const mensalidade of mensalidadesAtrasadas) {
          // Buscar email do cliente
          const clienteData = await db
            .select({ email: clientes.email })
            .from(clientes)
            .where(eq(clientes.id, mensalidade.clienteId))
            .limit(1);

          const clienteEmail = clienteData[0]?.email;
          if (!clienteEmail) continue;

          // Usar dataPagamento como referência ou createdAt
          const dataReferencia = mensalidade.dataPagamento || new Date();
          const diasAtrasado = Math.ceil(
            (hoje.getTime() - dataReferencia.getTime()) / (1000 * 60 * 60 * 24)
          );

          const valor = typeof mensalidade.valor === 'string'
            ? parseFloat(mensalidade.valor)
            : mensalidade.valor;

          const html = getMensalidadeAtrasadaTemplate(
            mensalidade.clienteNome,
            valor,
            diasAtrasado,
            dataReferencia
          );

          const sucesso = await sendNotificationEmail({
            from: process.env.SMTP_FROM || 'noreply@accounting-dashboard.com',
            to: clienteEmail,
            subject: `🚨 Mensalidade Atrasada: ${diasAtrasado} dias`,
            html,
          });

          if (sucesso) enviados++;
        }

        return { sucesso: true, enviados, total: mensalidadesAtrasadas.length };
      } catch (error) {
        console.error('Erro ao enviar alertas de mensalidades:', error);
        return { sucesso: false, enviados: 0, total: 0, erro: String(error) };
      }
    }),

  /**
   * Enviar notificações de checklist pendente
   */
  enviarAlertsChecklist: protectedProcedure
    .input(z.object({ mes: z.number(), ano: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) return { sucesso: false, enviados: 0, total: 0, erro: 'Database not available' };

        // Buscar clientes com checklist pendente do usuário
        const checklistPendente = await db
          .select({
            clienteId: checklistObrigacoes.clienteId,
            clienteNome: clientes.nome,
            clienteEmail: clientes.email,
          })
          .from(checklistObrigacoes)
          .innerJoin(clientes, eq(checklistObrigacoes.clienteId, clientes.id))
          .where(
            and(
              eq(checklistObrigacoes.userId, ctx.user.id),
              eq(checklistObrigacoes.mes, String(input.mes)),
              eq(checklistObrigacoes.ano, input.ano),
              eq(checklistObrigacoes.status, 'Pendente')
            )
          );

        // Agrupar por cliente
        const clientesPendentes: Record<number, { nome: string; email: string | null; count: number }> = {};
        for (const item of checklistPendente) {
          const key = item.clienteId;
          if (!clientesPendentes[key]) {
            clientesPendentes[key] = {
              nome: item.clienteNome,
              email: item.clienteEmail,
              count: 0,
            };
          }
          clientesPendentes[key].count++;
        }

        let enviados = 0;
        for (const cliente of Object.values(clientesPendentes)) {
          if (!cliente.email) continue;

          const html = getChecklistPendenteTemplate(
            cliente.nome,
            input.mes,
            input.ano,
            cliente.count
          );

          const sucesso = await sendNotificationEmail({
            from: process.env.SMTP_FROM || 'noreply@accounting-dashboard.com',
            to: cliente.email,
            subject: `📋 Checklist Mensal: ${cliente.count} obrigações pendentes`,
            html,
          });

          if (sucesso) enviados++;
        }

        return { sucesso: true, enviados, total: Object.keys(clientesPendentes).length };
      } catch (error) {
        console.error('Erro ao enviar alertas de checklist:', error);
        return { sucesso: false, enviados: 0, total: 0, erro: String(error) };
      }
    }),

  /**
   * Testar envio de email
   */
  testarEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      try {
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 5px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>✅ Email de Teste</h2>
                </div>
                <p>Este é um email de teste do Accounting Dashboard.</p>
                <p>Se você recebeu este email, o sistema de notificações está funcionando corretamente!</p>
              </div>
            </body>
          </html>
        `;

        const sucesso = await sendNotificationEmail({
          from: process.env.SMTP_FROM || 'noreply@accounting-dashboard.com',
          to: input.email,
          subject: '✅ Email de Teste - Accounting Dashboard',
          html,
        });

        return { sucesso };
      } catch (error) {
        console.error('Erro ao testar email:', error);
        return { sucesso: false, erro: String(error) };
      }
    }),
};
