import nodemailer from 'nodemailer';

// Tipos de notificação
export type NotificationType = 'obrigacao_vencimento' | 'mensalidade_atrasada' | 'checklist_pendente';

interface EmailConfig {
  from: string;
  to: string;
  subject: string;
  html: string;
}

// Configurar transporte de email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Enviar email de notificação
 */
export async function sendNotificationEmail(config: EmailConfig): Promise<boolean> {
  try {
    if (!config.to || !config.subject || !config.html) {
      console.error('Email config incompleto:', { to: config.to, subject: config.subject });
      return false;
    }

    await transporter.sendMail({
      from: config.from || process.env.SMTP_FROM || 'noreply@accounting-dashboard.com',
      to: config.to,
      subject: config.subject,
      html: config.html,
    });

    console.log(`Email enviado para ${config.to}: ${config.subject}`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
}

/**
 * Template de email para obrigação próxima do vencimento
 */
export function getObrigacaoVencimentoTemplate(
  clienteNome: string,
  obrigacaoNome: string,
  diasParaVencimento: number,
  dataPrazo: Date
): string {
  const dataFormatada = dataPrazo.toLocaleDateString('pt-BR');
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f97316; color: white; padding: 20px; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9fafb; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; color: #666; font-size: 12px; }
          .alert { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⚠️ Alerta de Obrigação Próxima do Vencimento</h2>
          </div>
          <div class="content">
            <p>Olá <strong>${clienteNome}</strong>,</p>
            <p>A obrigação <strong class="alert">${obrigacaoNome}</strong> vence em <strong>${diasParaVencimento} dias</strong>.</p>
            <p><strong>Data de Prazo:</strong> ${dataFormatada}</p>
            <p>Por favor, tome as medidas necessárias para cumprir essa obrigação dentro do prazo.</p>
          </div>
          <div class="footer">
            <p>Accounting Dashboard - Sistema de Gestão Contábil</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Template de email para mensalidade atrasada
 */
export function getMensalidadeAtrasadaTemplate(
  clienteNome: string,
  valor: number,
  diasAtrasado: number,
  dataVencimento: Date
): string {
  const dataFormatada = dataVencimento.toLocaleDateString('pt-BR');
  const valorFormatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9fafb; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; color: #666; font-size: 12px; }
          .alert { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🚨 Mensalidade Atrasada</h2>
          </div>
          <div class="content">
            <p>Olá <strong>${clienteNome}</strong>,</p>
            <p>Sua mensalidade está <strong class="alert">atrasada há ${diasAtrasado} dias</strong>.</p>
            <p><strong>Valor:</strong> ${valorFormatado}</p>
            <p><strong>Data de Vencimento:</strong> ${dataFormatada}</p>
            <p>Por favor, regularize sua situação o quanto antes.</p>
          </div>
          <div class="footer">
            <p>Accounting Dashboard - Sistema de Gestão Contábil</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Template de email para checklist pendente
 */
export function getChecklistPendenteTemplate(
  clienteNome: string,
  mes: number,
  ano: number,
  totalPendente: number
): string {
  const mesNome = new Date(ano, mes - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9fafb; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; color: #666; font-size: 12px; }
          .alert { color: #3b82f6; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📋 Checklist Mensal Pendente</h2>
          </div>
          <div class="content">
            <p>Olá <strong>${clienteNome}</strong>,</p>
            <p>Você tem <strong class="alert">${totalPendente} obrigações pendentes</strong> no checklist de <strong>${mesNome}</strong>.</p>
            <p>Por favor, atualize o status de suas obrigações no sistema.</p>
          </div>
          <div class="footer">
            <p>Accounting Dashboard - Sistema de Gestão Contábil</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
