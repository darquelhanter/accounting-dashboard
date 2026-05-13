import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, clientes, obrigacoes, checklistObrigacoes, controleMensalidades, notificacaoConfigs } from "../drizzle/schema";
import { ENV } from './_core/env';
import { eq, and } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    await db
      .insert(users)
      .values(values)
      .onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Error upserting user:", error);
    throw error;
  }
}

export async function getClientesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientes).where(eq(clientes.userId, userId));
}

export async function createCliente(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(clientes).values(data);
}

export async function updateCliente(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(clientes).set(data).where(eq(clientes.id, id));
}

export async function deleteCliente(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(clientes).where(eq(clientes.id, id));
}

// Obrigações
export async function getObrigacoesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(obrigacoes).where(eq(obrigacoes.userId, userId));
}

export async function createObrigacao(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(obrigacoes).values(data);
}

export async function updateObrigacao(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(obrigacoes).set(data).where(eq(obrigacoes.id, id));
}

export async function deleteObrigacao(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(obrigacoes).where(eq(obrigacoes.id, id));
}

// Checklist
export async function getChecklistByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checklistObrigacoes).where(eq(checklistObrigacoes.userId, userId));
}

export async function getChecklistByUserAndMonth(userId: number, mes: string, ano: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checklistObrigacoes)
    .where(
      and(
        eq(checklistObrigacoes.userId, userId),
        eq(checklistObrigacoes.mes, mes),
        eq(checklistObrigacoes.ano, ano)
      )
    );
}

export async function getChecklistByCliente(clienteId: number, mes: string, ano: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checklistObrigacoes)
    .where(
      and(
        eq(checklistObrigacoes.clienteId, clienteId),
        eq(checklistObrigacoes.mes, mes),
        eq(checklistObrigacoes.ano, ano)
      )
    );
}

export async function createChecklistItem(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(checklistObrigacoes).values(data);
}

export async function updateChecklistItem(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(checklistObrigacoes).set(data).where(eq(checklistObrigacoes.id, id));
}

export async function deleteChecklistItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(checklistObrigacoes).where(eq(checklistObrigacoes.id, id));
}

// Mensalidades
export async function getMensalidadesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(controleMensalidades).where(eq(controleMensalidades.userId, userId));
}

export async function getMensalidadesByUserAndMonth(userId: number, mes: string, ano: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(controleMensalidades)
    .where(
      and(
        eq(controleMensalidades.userId, userId),
        eq(controleMensalidades.mes, mes),
        eq(controleMensalidades.ano, ano)
      )
    );
}

export async function getMensalidadesByCliente(clienteId: number, mes?: string, ano?: number) {
  const db = await getDb();
  if (!db) return [];
  let result = await db.select().from(controleMensalidades).where(eq(controleMensalidades.clienteId, clienteId));
  if (mes && ano) {
    result = result.filter(m => m.mes === mes && m.ano === ano);
  }
  return result;
}

export async function createMensalidade(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(controleMensalidades).values(data);
}

export async function updateMensalidade(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(controleMensalidades).set(data).where(eq(controleMensalidades.id, id));
}

export async function deleteMensalidade(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(controleMensalidades).where(eq(controleMensalidades.id, id));
}

export async function getAlertasSumario(userId: number) {
  const db = await getDb();
  if (!db) return { obrigacoesProximas: 0, mensalidadesAtrasadas: 0, mensalidadesPendentes: 0 };
  
  const obrigacoes = await getObrigacoesProximasVencimento(userId, 7);
  const mensalidadesAtrasadas = await getMensalidadesAtrasadas(userId);
  const mensalidadesPendentes = await getMensalidadesPendentesProximas(userId, 3);
  
  return {
    obrigacoesProximas: obrigacoes.length,
    mensalidadesAtrasadas: mensalidadesAtrasadas.length,
    mensalidadesPendentes: mensalidadesPendentes.length,
  };
}

// Alertas
export async function getObrigacoesProximasVencimento(userId: number, dias: number = 7) {
  const db = await getDb();
  if (!db) return [];

  const clientesList = await db.select().from(clientes).where(eq(clientes.userId, userId));
  const obrigacoesList = await db.select().from(obrigacoes).where(eq(obrigacoes.userId, userId));

  const hoje = new Date();
  const proximosDias = new Date(hoje.getTime() + dias * 24 * 60 * 60 * 1000);

  return obrigacoesList.filter((obrigacao: any) => {
    if (!obrigacao.vencimento) return false;

    const dataVencimento = parseInt(obrigacao.vencimento);
    const diaAtual = hoje.getDate();
    const diaProximo = proximosDias.getDate();

    return dataVencimento <= proximosDias.getDate() && dataVencimento >= hoje.getDate();
  });
}

export async function getMensalidadesAtrasadas(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const mensalidades = await db.select().from(controleMensalidades).where(eq(controleMensalidades.userId, userId));

  return mensalidades.filter((m: any) => m.status === "Atrasado");
}

export async function getMensalidadesPendentesProximas(userId: number, dias: number = 3) {
  const db = await getDb();
  if (!db) return [];

  const mensalidades = await db.select().from(controleMensalidades).where(eq(controleMensalidades.userId, userId));

  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  return mensalidades.filter((m: any) => {
    if (m.status !== "Pendente") return false;
    
    const mesNum = parseInt(m.mes.split('/')[0] || '0');
    const anoNum = parseInt(m.mes.split('/')[1] || '0');
    
    return (mesNum === mesAtual || mesNum === mesAtual + 1) && anoNum === anoAtual;
  });
}


// Funções de KPIs para a Home
export async function getKpisData(userId: number) {
  const db = await getDb();
  if (!db) {
    return {
      totalClientes: 0,
      obrigacoesPendentes: 0,
      mensalidadesAtrasadas: 0,
      taxaConclusao: 0,
    };
  }

  try {
    // Total de clientes
    const clientesList = await db.select().from(clientes).where(eq(clientes.userId, userId));
    const totalClientes = clientesList.length;

    // Obrigações pendentes (próximas do vencimento nos próximos 7 dias)
    const obrigacoesProximas = await getObrigacoesProximasVencimento(userId, 7);
    const obrigacoesPendentes = obrigacoesProximas.length;

    // Mensalidades atrasadas
    const mensalidadesList = await db.select().from(controleMensalidades).where(eq(controleMensalidades.userId, userId));
    const mensalidadesAtrasadas = mensalidadesList.filter((m: any) => m.status === "Atrasado").length;

    // Taxa de conclusão do checklist
    const checklistItems = await db.select().from(checklistObrigacoes).where(eq(checklistObrigacoes.userId, userId));
    const checklistConcluidos = checklistItems.filter((item: any) => item.status === "Done").length;
    const taxaConclusao = checklistItems.length > 0 ? Math.round((checklistConcluidos / checklistItems.length) * 100) : 0;

    return {
      totalClientes,
      obrigacoesPendentes,
      mensalidadesAtrasadas,
      taxaConclusao,
    };
  } catch (error) {
    console.error("[Database] Error getting KPIs:", error);
    return {
      totalClientes: 0,
      obrigacoesPendentes: 0,
      mensalidadesAtrasadas: 0,
      taxaConclusao: 0,
    };
  }
}

// Notificação Configs
export async function getNotificacaoConfig(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(notificacaoConfigs).where(eq(notificacaoConfigs.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createNotificacaoConfig(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(notificacaoConfigs).values(data);
}

export async function updateNotificacaoConfig(userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(notificacaoConfigs).set(data).where(eq(notificacaoConfigs.userId, userId));
}

export async function deleteNotificacaoConfig(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(notificacaoConfigs).where(eq(notificacaoConfigs.userId, userId));
}

export async function getAllNotificacaoConfigs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notificacaoConfigs).where(eq(notificacaoConfigs.ativo, true));
}

// Vinculação automática de obrigações por regime
export async function linkObrigacoesByRegime(clienteId: number, userId: number, regime: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Buscar todas as obrigacoes
    const todasAsObrigacoes = await db
      .select()
      .from(obrigacoes);
    
    // Filtrar por regime (incluindo "Todos")
    const obrigacoesDoRegime = todasAsObrigacoes.filter((o: any) => o.regime === regime || o.regime === "Todos");
    const todasAsObrigacoesFiltered = obrigacoesDoRegime;

    if (todasAsObrigacoesFiltered.length === 0) {
      return { sucesso: true, criadas: 0, mensagem: "Nenhuma obrigação encontrada para este regime" };
    }

    let criadas = 0;
    const anoAtual = new Date().getFullYear();

    // Para cada obrigacao do regime
    for (const obrigacao of todasAsObrigacoesFiltered) {
      // Se for mensal, criar entradas para todos os 12 meses
      if (obrigacao.periodicidade === "Mensal") {
        for (let mes = 1; mes <= 12; mes++) {
          const mesPadrao = mes.toString().padStart(2, "0");
          
          // Verificar se já existe
          const existe = await db
            .select()
            .from(checklistObrigacoes)
            .where(
              and(
                eq(checklistObrigacoes.clienteId, clienteId),
                eq(checklistObrigacoes.obrigacaoId, obrigacao.id),
                eq(checklistObrigacoes.mes, mesPadrao),
                eq(checklistObrigacoes.ano, anoAtual)
              )
            );

          if (existe.length === 0) {
            await db.insert(checklistObrigacoes).values({
              userId,
              clienteId,
              obrigacaoId: obrigacao.id,
              mes: mesPadrao,
              ano: anoAtual,
              status: "Pendente",
              responsavel: null,
            });
            criadas++;
          }
        }
      } else {
        // Se for anual ou outro, criar apenas uma entrada
        const existe = await db
          .select()
          .from(checklistObrigacoes)
          .where(
            and(
              eq(checklistObrigacoes.clienteId, clienteId),
              eq(checklistObrigacoes.obrigacaoId, obrigacao.id),
              eq(checklistObrigacoes.ano, anoAtual)
            )
          );

        if (existe.length === 0) {
          await db.insert(checklistObrigacoes).values({
            userId,
            clienteId,
            obrigacaoId: obrigacao.id,
            mes: "01",
            ano: anoAtual,
            status: "Pendente",
            responsavel: null,
          });
          criadas++;
        }
      }
    }

    return {
      sucesso: true,
      criadas,
      mensagem: `${criadas} obrigação(ões) vinculada(s) ao cliente`,
    };
  } catch (error) {
    console.error("[Database] Error linking obligations:", error);
    throw error;
  }
}


export async function getMensalidadesByStatus(userId: number, status: string) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(controleMensalidades).where(eq(controleMensalidades.userId, userId));
  return result.filter((m: any) => m.status === status);
}


export async function getMensalidadesPendentes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(controleMensalidades).where(eq(controleMensalidades.userId, userId));
  return result.filter((m: any) => m.status === "Pendente");
}

export async function getTotalMensalidadesByUser(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, pago: 0, pendente: 0, atrasado: 0 };
  const result = await db.select().from(controleMensalidades).where(eq(controleMensalidades.userId, userId));
  
  let total = 0;
  let pago = 0;
  let pendente = 0;
  let atrasado = 0;
  
  for (const m of result) {
    const valor = typeof m.valor === 'string' ? parseFloat(m.valor) : m.valor;
    total += valor || 0;
    
    if (m.status === 'Pago') pago += valor || 0;
    else if (m.status === 'Pendente') pendente += valor || 0;
    else if (m.status === 'Atrasado') atrasado += valor || 0;
  }
  
  return { total, pago, pendente, atrasado };
}


export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
