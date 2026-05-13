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

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Clientes
export async function getClientesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientes).where(eq(clientes.userId, userId));
}

export async function createCliente(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clientes).values(data);
  const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;
  if (!insertId) throw new Error("Failed to get insert ID");
  const cliente = await db.select().from(clientes).where(eq(clientes.id, insertId));
  return cliente[0] || { id: insertId, ...data };
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

// Checklist Obrigações
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

// Controle Mensalidades
export async function getMensalidadesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(controleMensalidades).where(eq(controleMensalidades.userId, userId));
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

export async function getMensalidadesByStatus(userId: number, status: string) {
  const db = await getDb();
  if (!db) return [];
  const all = await db.select().from(controleMensalidades).where(eq(controleMensalidades.userId, userId));
  return all.filter(m => m.status === status);
}

export async function getMensalidadesPendentes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const all = await db.select().from(controleMensalidades).where(eq(controleMensalidades.userId, userId));
  return all.filter(m => m.status === "Pendente" || m.status === "Atrasado");
}

export async function getTotalMensalidadesByUser(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, pago: 0, pendente: 0, atrasado: 0 };
  const mensalidades = await db.select().from(controleMensalidades).where(eq(controleMensalidades.userId, userId));
  
  let total = 0;
  let pago = 0;
  let pendente = 0;
  let atrasado = 0;
  
  for (const m of mensalidades) {
    const valor = parseFloat(m.valor.toString());
    total += valor;
    if (m.status === "Pago") pago += valor;
    if (m.status === "Pendente") pendente += valor;
    if (m.status === "Atrasado") atrasado += valor;
  }
  
  return { total, pago, pendente, atrasado };
}


// Funções de Alertas
export async function getObrigacoesProximasVencimento(userId: number, diasAntecedencia: number = 7) {
  const db = await getDb();
  if (!db) return [];
  
  const obrigacoesList = await db.select().from(obrigacoes).where(eq(obrigacoes.userId, userId));
  
  const hoje = new Date();
  const proximosDias = new Date(hoje.getTime() + diasAntecedencia * 24 * 60 * 60 * 1000);
  
  return obrigacoesList.filter(obrigacao => {
    if (!obrigacao.vencimento) return false;
    
    const diaVencimento = obrigacao.vencimento;
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    let dataVencimento = new Date(anoAtual, mesAtual, diaVencimento);
    
    // Se o vencimento já passou este mês, considerar próximo mês
    if (dataVencimento < hoje) {
      dataVencimento = new Date(anoAtual, mesAtual + 1, diaVencimento);
    }
    
    return dataVencimento <= proximosDias && dataVencimento >= hoje;
  });
}

export async function getMensalidadesAtrasadas(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const mensalidades = await db.select().from(controleMensalidades)
    .where(eq(controleMensalidades.userId, userId));
  
  return mensalidades.filter(m => m.status === "Atrasado");
}

export async function getMensalidadesPendentesProximas(userId: number, diasAntecedencia: number = 3) {
  const db = await getDb();
  if (!db) return [];
  
  const mensalidades = await db.select().from(controleMensalidades)
    .where(eq(controleMensalidades.userId, userId));
  
  const hoje = new Date();
  const proximosDias = new Date(hoje.getTime() + diasAntecedencia * 24 * 60 * 60 * 1000);
  
  return mensalidades.filter(m => {
    if (m.status !== "Pendente") return false;
    
    // Considerar mensalidades do mês atual e próximo mês como próximas
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();
    
    const mesNum = parseInt(m.mes.split('/')[0] || '0');
    const anoNum = parseInt(m.mes.split('/')[1] || '0');
    
    return (mesNum === mesAtual || mesNum === mesAtual + 1) && anoNum === anoAtual;
  });
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


// Função para vincular automaticamente obrigações ao checklist quando um cliente é criado
export async function linkObrigacoesToChecklistByRegime(clienteId: number, regime: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Buscar o cliente para obter o userId
    const cliente = await db.select().from(clientes).where(eq(clientes.id, clienteId));
    if (!cliente || cliente.length === 0) {
      throw new Error(`Cliente com ID ${clienteId} não encontrado`);
    }
    const userId = cliente[0].userId;

    // Buscar todas as obrigações que correspondem ao regime
    const todasAsObrigacoes = await db.select().from(obrigacoes);
    const obrigacoesDoRegime = todasAsObrigacoes.filter(
      (o: any) => o.regime === regime || o.regime === "Todos"
    );

    if (obrigacoesDoRegime.length === 0) {
      console.log(`Nenhuma obrigação encontrada para o regime: ${regime}`);
      return [];
    }

    const checklistItems: any[] = [];
    const anoAtual = new Date().getFullYear();
    const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                         "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    // Para cada obrigação, criar entradas no checklist
    for (const obrigacao of obrigacoesDoRegime) {
      // Se a obrigação é mensal, criar entradas para todos os 12 meses
      if (obrigacao.periodicidade === "Mensal") {
        for (let mes = 0; mes < 12; mes++) {
          checklistItems.push({
            userId,
            clienteId,
            obrigacaoId: obrigacao.id,
            mes: mesesNomes[mes],
            ano: anoAtual,
            status: "Pendente",
          });
        }
      } else if (obrigacao.periodicidade === "Anual") {
        // Se é anual, criar apenas uma entrada para o ano atual
        checklistItems.push({
          userId,
          clienteId,
          obrigacaoId: obrigacao.id,
          mes: "Dezembro",
          ano: anoAtual,
          status: "Pendente",
        });
      } else if (obrigacao.periodicidade === "Contínuo") {
        // Se é contínuo, criar 4 entradas (meses 3, 6, 9, 12)
        for (const mesIdx of [2, 5, 8, 11]) {
          checklistItems.push({
            userId,
            clienteId,
            obrigacaoId: obrigacao.id,
            mes: mesesNomes[mesIdx],
            ano: anoAtual,
            status: "Pendente",
          });
        }
      }
    }

    // Inserir todos os itens do checklist
    if (checklistItems.length > 0) {
      console.log(`Criando ${checklistItems.length} entradas no checklist para cliente ${clienteId}`);
      await db.insert(checklistObrigacoes).values(checklistItems);
    }

    return checklistItems;
  } catch (error) {
    console.error("Erro ao vincular obrigações ao checklist:", error);
    throw error;
  }
}
