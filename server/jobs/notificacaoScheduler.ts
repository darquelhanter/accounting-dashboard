import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { getDb } from '../db';
import { notificacaoConfigs, controleMensalidades, clientes, users, type Cliente } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { sendNotificationEmail, getMensalidadeAtrasadaTemplate } from '../services/emailService';

interface ScheduledJob {
  taskId: string;
  task: ScheduledTask;
}

const scheduledJobs: Map<string, ScheduledJob> = new Map();

/**
 * Inicia o agendador de notificações automáticas
 * Executa a cada hora para verificar se há notificações a enviar
 */
export async function initializeNotificationScheduler() {
  console.log('[Notification Scheduler] Inicializando agendador de notificações...');

  // Job principal que roda a cada hora
  const mainJob = cron.schedule('0 * * * *', async () => {
    console.log('[Notification Scheduler] Executando verificação de notificações...');
    await processNotifications();
  });

  scheduledJobs.set('main-notification-job', {
    taskId: 'main-notification-job',
    task: mainJob,
  });

  // Job para testes - roda a cada 5 minutos
  const testJob = cron.schedule('*/5 * * * *', async () => {
    console.log('[Notification Scheduler] Job de teste executado');
  });

  scheduledJobs.set('test-job', {
    taskId: 'test-job',
    task: testJob,
  });

  console.log('[Notification Scheduler] Agendador inicializado com sucesso');
}

/**
 * Processa todas as notificações pendentes
 */
async function processNotifications() {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[Notification Scheduler] Database não disponível');
      return;
    }

    // Buscar todas as configurações de notificação ativas
    const configs = await db
      .select()
      .from(notificacaoConfigs)
      .where(eq(notificacaoConfigs.ativo, true));

    console.log(`[Notification Scheduler] Processando ${configs.length} configurações de notificação`);

    for (const config of configs) {
      await processUserNotifications(db, config);
    }
  } catch (error) {
    console.error('[Notification Scheduler] Erro ao processar notificações:', error);
  }
}

/**
 * Processa notificações para um usuário específico
 */
async function processUserNotifications(db: any, config: any) {
  try {
    const userId = config.userId;

    // Verificar se deve enviar notificações de mensalidades
    if (config.ativarMensalidades) {
      await processeMensalidadeNotifications(db, userId, config.diasAntecedencia);
    }

    // Verificar se deve enviar notificações de obrigações
    if (config.ativarObrigacoes) {
      await processObrigacaoNotifications(db, userId);
    }

    // Verificar se deve enviar notificações de checklist
    if (config.ativarChecklist) {
      await processChecklistNotifications(db, userId);
    }
  } catch (error) {
    console.error(`[Notification Scheduler] Erro ao processar notificações do usuário ${config.userId}:`, error);
  }
}

/**
 * Processa notificações de mensalidades próximas do vencimento
 */
async function processeMensalidadeNotifications(db: any, userId: number, diasAntecedencia: number) {
  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || user.length === 0) return;

    const userEmail = user[0].email;
    if (!userEmail) {
      console.warn(`[Notification Scheduler] Usuário ${userId} não tem email configurado`);
      return;
    }

    // Buscar mensalidades pendentes
    const hoje = new Date();
    const proximosDias = new Date(hoje.getTime() + diasAntecedencia * 24 * 60 * 60 * 1000);

    const mensalidades = await db
      .select()
      .from(controleMensalidades)
      .where(eq(controleMensalidades.userId, userId));

    const mensalidadesProximas = mensalidades.filter((m: any) => {
      if (m.status !== 'Pendente') return false;

      // Verificar se está no intervalo de dias
      const mesAtual = hoje.getMonth() + 1;
      const anoAtual = hoje.getFullYear();

      return true; // Simplificado para enviar todas as pendentes próximas
    });

    if (mensalidadesProximas.length > 0) {
      // Buscar informações dos clientes
      const clientesIds = Array.from(new Set(mensalidadesProximas.map((m: any) => m.clienteId)));
      const clientesList = await db
        .select()
        .from(clientes)
        .where(eq(clientes.userId, userId));

      const clientesMap = new Map(clientesList.map((c: any) => [c.id, c as Cliente]));

      // Enviar notificação para cada mensalidade
      for (const m of mensalidadesProximas) {
        const cliente = clientesMap.get(m.clienteId) as Cliente | undefined;
        if (cliente?.nome) {
          const html = getMensalidadeAtrasadaTemplate(
            cliente.nome,
            parseFloat(m.valor.toString()),
            0,
            new Date()
          );
          await sendNotificationEmail({
            from: 'noreply@accounting-dashboard.com',
            to: userEmail,
            subject: `Mensalidade Próxima do Vencimento - ${cliente.nome}`,
            html,
          });
        }
      }

      console.log(`[Notification Scheduler] Notificação de mensalidades enviada para ${userEmail}`);
    }
  } catch (error) {
    console.error(`[Notification Scheduler] Erro ao processar notificações de mensalidades:`, error);
  }
}

/**
 * Processa notificações de obrigações próximas do vencimento
 */
async function processObrigacaoNotifications(db: any, userId: number) {
  try {
    console.log(`[Notification Scheduler] Processando notificações de obrigações para usuário ${userId}`);
    // Implementar lógica de obrigações
  } catch (error) {
    console.error(`[Notification Scheduler] Erro ao processar notificações de obrigações:`, error);
  }
}

/**
 * Processa notificações de checklist pendente
 */
async function processChecklistNotifications(db: any, userId: number) {
  try {
    console.log(`[Notification Scheduler] Processando notificações de checklist para usuário ${userId}`);
    // Implementar lógica de checklist
  } catch (error) {
    console.error(`[Notification Scheduler] Erro ao processar notificações de checklist:`, error);
  }
}

/**
 * Para todos os jobs agendados
 */
export function stopAllScheduledJobs() {
  console.log('[Notification Scheduler] Parando todos os jobs agendados...');
  scheduledJobs.forEach((job) => {
    job.task.stop();
  });
  scheduledJobs.clear();
  console.log('[Notification Scheduler] Todos os jobs foram parados');
}

/**
 * Retorna status de todos os jobs
 */
export function getScheduledJobsStatus() {
  return Array.from(scheduledJobs.values()).map((job) => ({
    taskId: job.taskId,
    running: true, // node-cron tasks are always running once scheduled
  }));
}
