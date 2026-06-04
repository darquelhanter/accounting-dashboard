import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, clientes, obrigacoes, checklistObrigacoes, controleMensalidades, notificacaoConfigs, clientePermissions, auditLog, clientesBackup, syncLog, servicosPrestados, documentos, acessosEmpresas, responsaveis, socios, portalClientes, portalFluxoCaixa } from "../drizzle/schema";
import { ENV } from './_core/env';
import { eq, and, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";

let _db: ReturnType<typeof drizzle> | null = null;

function getDbUrl(): string | undefined {
  return process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  const url = getDbUrl();
  if (!_db && url) {
    try {
      _db = drizzle(url);
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

// Autenticação Local
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createLocalUser(email: string, name: string, password: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verificar se email já existe
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("Email já cadastrado");
  }

  // Hash da senha
  const passwordHash = await bcrypt.hash(password, 10);

  // Criar usuário com openId gerado
  const openId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const result = await db.insert(users).values({
    openId,
    email,
    name,
    passwordHash,
    loginMethod: "local",
    role: "user",
    lastSignedIn: new Date(),
  });

  return getUserByEmail(email);
}

export async function verifyPassword(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return user;
}

// Aprovação de Usuários
export async function getPendingUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.status, 'pending'));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users);
}

export async function approveUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ status: 'approved' }).where(eq(users.id, userId));
  return getUserById(userId);
}

export async function rejectUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ status: 'rejected' }).where(eq(users.id, userId));
  return getUserById(userId);
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteUsers(userIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (userIds.length === 0) return 0;
  
  const { inArray } = await import('drizzle-orm');
  await db.delete(users).where(inArray(users.id, userIds));
  return userIds.length;
}

// Retorna todos os clienteIds que o usuário pode acessar (próprios + compartilhados)
export async function getAccessibleClienteIds(userId: number, isAdmin: boolean = false): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  if (isAdmin) {
    const todos = await db.select({ id: clientes.id }).from(clientes);
    return todos.map(c => c.id);
  }
  const proprios = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, userId));
  const perms = await db.select({ clienteId: clientePermissions.clienteId })
    .from(clientePermissions).where(eq(clientePermissions.userId, userId));
  return [...new Set([...proprios.map(c => c.id), ...perms.map(p => p.clienteId)])];
}

// Clientes
export async function getClienteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
  return result[0] ?? undefined;
}

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
export async function getObrigacoesByUser(userId: number, isAdmin: boolean = false) {
  const db = await getDb();
  if (!db) return [];

  // Admin vê todas as obrigações do sistema
  if (isAdmin) {
    return db.select().from(obrigacoes);
  }

  const proprias = await db.select().from(obrigacoes).where(eq(obrigacoes.userId, userId));

  // Incluir obrigações dos donos de clientes compartilhados
  const perms = await db.select({ clienteId: clientePermissions.clienteId })
    .from(clientePermissions).where(eq(clientePermissions.userId, userId));
  if (perms.length === 0) return proprias;

  const donoRows = await db.select({ userId: clientes.userId }).from(clientes)
    .where(inArray(clientes.id, perms.map(p => p.clienteId)));
  const donoIds = [...new Set(donoRows.map(d => d.userId))].filter(id => id !== userId);
  if (donoIds.length === 0) return proprias;

  const doDono = await db.select().from(obrigacoes).where(inArray(obrigacoes.userId, donoIds));
  const todas = [...proprias, ...doDono];
  return Array.from(new Map(todas.map(o => [o.id, o])).values());
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

export async function getChecklistByUserAndMonth(userId: number, mes: string, ano: number, isAdmin: boolean = false) {
  const db = await getDb();
  if (!db) return [];

  const clienteIds = await getAccessibleClienteIds(userId, isAdmin);
  if (clienteIds.length === 0) return [];

  return db.select().from(checklistObrigacoes)
    .where(
      and(
        inArray(checklistObrigacoes.clienteId, clienteIds),
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
export async function getMensalidadesByUser(userId: number, isAdmin: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  const clienteIds = await getAccessibleClienteIds(userId, isAdmin);
  if (clienteIds.length === 0) return [];
  return db.select().from(controleMensalidades).where(inArray(controleMensalidades.clienteId, clienteIds));
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

export async function getMensalidadesByUserAndMonth(userId: number, mes: string, ano: number, isAdmin: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  const clienteIds = await getAccessibleClienteIds(userId, isAdmin);
  if (clienteIds.length === 0) return [];
  return db.select().from(controleMensalidades)
    .where(
      and(
        inArray(controleMensalidades.clienteId, clienteIds),
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

export async function getMensalidadesByStatus(userId: number, status: string, isAdmin: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  const clienteIds = await getAccessibleClienteIds(userId, isAdmin);
  if (clienteIds.length === 0) return [];
  const all = await db.select().from(controleMensalidades).where(inArray(controleMensalidades.clienteId, clienteIds));
  return all.filter(m => m.status === status);
}

export async function getMensalidadesPendentes(userId: number, isAdmin: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  const clienteIds = await getAccessibleClienteIds(userId, isAdmin);
  if (clienteIds.length === 0) return [];
  const all = await db.select().from(controleMensalidades).where(inArray(controleMensalidades.clienteId, clienteIds));
  return all.filter(m => m.status === "Pendente" || m.status === "Atrasado");
}

export async function getTotalMensalidadesByUser(userId: number, isAdmin: boolean = false) {
  const db = await getDb();
  if (!db) return { total: 0, pago: 0, pendente: 0, atrasado: 0 };
  const clienteIds = await getAccessibleClienteIds(userId, isAdmin);
  if (clienteIds.length === 0) return { total: 0, pago: 0, pendente: 0, atrasado: 0 };
  const mensalidades = await db.select().from(controleMensalidades).where(inArray(controleMensalidades.clienteId, clienteIds));
  
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


const MESES_NOMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Funções de Alertas
export async function getObrigacoesProximasVencimento(userId: number, diasAntecedencia: number = 7, isAdmin: boolean = false) {
  const db = await getDb();
  if (!db) return [];

  const obrigacoesList = await getObrigacoesByUser(userId, isAdmin);
  
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

export async function getMensalidadesAtrasadas(userId: number, isAdmin: boolean = false) {
  const db = await getDb();
  if (!db) return [];

  const clienteIds = await getAccessibleClienteIds(userId, isAdmin);
  if (clienteIds.length === 0) return [];

  const mensalidades = await db.select().from(controleMensalidades)
    .where(inArray(controleMensalidades.clienteId, clienteIds));

  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1;

  const atrasadas = mensalidades.filter(m => {
    if (m.status === "Atrasado") return true;
    if (m.status === "Pendente") {
      const mesIdx = MESES_NOMES.indexOf(m.mes);
      if (mesIdx === -1) return false;
      const mesNum = mesIdx + 1;
      return m.ano < anoAtual || (m.ano === anoAtual && mesNum < mesAtual);
    }
    return false;
  });

  // Enriquecer com nome do cliente
  const clientesRows = clienteIds.length > 0
    ? await db.select({ id: clientes.id, nome: clientes.nome }).from(clientes).where(inArray(clientes.id, clienteIds))
    : [];
  const clienteMap = new Map(clientesRows.map(c => [c.id, c.nome]));

  return atrasadas.map(m => ({
    ...m,
    clienteNome: clienteMap.get(m.clienteId) ?? "-",
  }));
}

export async function getMensalidadesPendentesProximas(userId: number, diasAntecedencia: number = 3, isAdmin: boolean = false) {
  const db = await getDb();
  if (!db) return [];

  const clienteIds = await getAccessibleClienteIds(userId, isAdmin);
  if (clienteIds.length === 0) return [];

  const mensalidades = await db.select().from(controleMensalidades)
    .where(inArray(controleMensalidades.clienteId, clienteIds));

  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  const pendentes = mensalidades.filter(m => {
    if (m.status !== "Pendente") return false;
    const mesIdx = MESES_NOMES.indexOf(m.mes);
    if (mesIdx === -1) return false;
    const mesNum = mesIdx + 1;
    return (mesNum === mesAtual || mesNum === mesAtual + 1) && m.ano === anoAtual;
  });

  // Enriquecer com nome do cliente
  const clientesRows = clienteIds.length > 0
    ? await db.select({ id: clientes.id, nome: clientes.nome }).from(clientes).where(inArray(clientes.id, clienteIds))
    : [];
  const clienteMap = new Map(clientesRows.map(c => [c.id, c.nome]));

  return pendentes.map(m => ({
    ...m,
    clienteNome: clienteMap.get(m.clienteId) ?? "-",
  }));
}

export async function getAlertasSumario(userId: number, isAdmin: boolean = false) {
  const db = await getDb();
  if (!db) return { obrigacoesProximas: 0, mensalidadesAtrasadas: 0, mensalidadesPendentes: 0 };

  const obrigacoes = await getObrigacoesProximasVencimento(userId, 7, isAdmin);
  const mensalidadesAtrasadas = await getMensalidadesAtrasadas(userId, isAdmin);
  const mensalidadesPendentes = await getMensalidadesPendentesProximas(userId, 3, isAdmin);
  
  return {
    obrigacoesProximas: obrigacoes.length,
    mensalidadesAtrasadas: mensalidadesAtrasadas.length,
    mensalidadesPendentes: mensalidadesPendentes.length,
  };
}


// Funções de KPIs para a Home
export async function getKpisData(userId: number, isAdmin: boolean = false) {
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
    const clienteIds = await getAccessibleClienteIds(userId, isAdmin);
    const totalClientes = clienteIds.length;

    let obrigacoesPendentes = 0;
    let mensalidadesAtrasadas = 0;
    let taxaConclusao = 0;

    if (clienteIds.length > 0) {
      const hoje = new Date();
      const mesAtualNome = MESES_NOMES[hoje.getMonth()];
      const anoAtual = hoje.getFullYear();

      // Obrigações Pendentes: itens do checklist no mês atual que não estão Feitos nem N/A
      const checklistMesAtual = await db.select().from(checklistObrigacoes)
        .where(
          and(
            inArray(checklistObrigacoes.clienteId, clienteIds),
            eq(checklistObrigacoes.mes, mesAtualNome),
            eq(checklistObrigacoes.ano, anoAtual)
          )
        );
      obrigacoesPendentes = checklistMesAtual.filter(
        (item: any) => item.status !== "Feito" && item.status !== "N/A"
      ).length;

      // Taxa de Conclusão: todos os itens do checklist (não N/A)
      const todosChecklist = await db.select().from(checklistObrigacoes)
        .where(inArray(checklistObrigacoes.clienteId, clienteIds));
      const validos = todosChecklist.filter((item: any) => item.status !== "N/A");
      const concluidos = validos.filter((item: any) => item.status === "Feito");
      taxaConclusao = validos.length > 0 ? Math.round((concluidos.length / validos.length) * 100) : 0;

      // Mensalidades Atrasadas: status "Atrasado" OU status "Pendente" de mês/ano já passado
      const mensalidadesList = await db.select().from(controleMensalidades)
        .where(inArray(controleMensalidades.clienteId, clienteIds));
      mensalidadesAtrasadas = mensalidadesList.filter((m: any) => {
        if (m.status === "Atrasado") return true;
        if (m.status === "Pendente") {
          const mesIdx = MESES_NOMES.indexOf(m.mes);
          if (mesIdx === -1) return false;
          const mesNum = mesIdx + 1;
          return m.ano < anoAtual || (m.ano === anoAtual && mesNum < hoje.getMonth() + 1);
        }
        return false;
      }).length;
    }

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

    const anoAtual = new Date().getFullYear();
    const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                         "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    // Carregar itens já existentes para evitar duplicatas
    const existentes = await db.select({ obrigacaoId: checklistObrigacoes.obrigacaoId, mes: checklistObrigacoes.mes })
      .from(checklistObrigacoes)
      .where(and(eq(checklistObrigacoes.clienteId, clienteId), eq(checklistObrigacoes.ano, anoAtual)));
    const existentesSet = new Set(existentes.map(e => `${e.obrigacaoId}-${e.mes}`));

    const checklistItems: any[] = [];
    for (const obrigacao of obrigacoesDoRegime) {
      if (obrigacao.periodicidade === "Mensal") {
        for (let mes = 0; mes < 12; mes++) {
          const key = `${obrigacao.id}-${mesesNomes[mes]}`;
          if (!existentesSet.has(key))
            checklistItems.push({ userId, clienteId, obrigacaoId: obrigacao.id, mes: mesesNomes[mes], ano: anoAtual, status: "Pendente" });
        }
      } else if (obrigacao.periodicidade === "Anual") {
        const key = `${obrigacao.id}-Dezembro`;
        if (!existentesSet.has(key))
          checklistItems.push({ userId, clienteId, obrigacaoId: obrigacao.id, mes: "Dezembro", ano: anoAtual, status: "Pendente" });
      } else if (obrigacao.periodicidade === "Contínuo") {
        for (const mesIdx of [2, 5, 8, 11]) {
          const key = `${obrigacao.id}-${mesesNomes[mesIdx]}`;
          if (!existentesSet.has(key))
            checklistItems.push({ userId, clienteId, obrigacaoId: obrigacao.id, mes: mesesNomes[mesIdx], ano: anoAtual, status: "Pendente" });
        }
      }
    }

    if (checklistItems.length > 0) {
      await db.insert(checklistObrigacoes).values(checklistItems);
    }

    return checklistItems;
  } catch (error) {
    console.error("Erro ao vincular obrigações ao checklist:", error);
    throw error;
  }
}

export async function linkObrigacoesByIds(clienteId: number, obrigacaoIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const cliente = await db.select().from(clientes).where(eq(clientes.id, clienteId));
  if (!cliente.length) throw new Error(`Cliente ${clienteId} não encontrado`);
  const userId = cliente[0].userId;

  if (obrigacaoIds.length === 0) return [];

  const selecionadas = await db.select().from(obrigacoes).where(inArray(obrigacoes.id, obrigacaoIds));

  const anoAtual = new Date().getFullYear();
  const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                       "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const existentes = await db.select({ obrigacaoId: checklistObrigacoes.obrigacaoId, mes: checklistObrigacoes.mes })
    .from(checklistObrigacoes)
    .where(and(eq(checklistObrigacoes.clienteId, clienteId), eq(checklistObrigacoes.ano, anoAtual)));
  const existentesSet = new Set(existentes.map(e => `${e.obrigacaoId}-${e.mes}`));

  const checklistItems: any[] = [];
  for (const obrigacao of selecionadas) {
    if (obrigacao.periodicidade === "Mensal") {
      for (let mes = 0; mes < 12; mes++) {
        const key = `${obrigacao.id}-${mesesNomes[mes]}`;
        if (!existentesSet.has(key))
          checklistItems.push({ userId, clienteId, obrigacaoId: obrigacao.id, mes: mesesNomes[mes], ano: anoAtual, status: "Pendente" });
      }
    } else if (obrigacao.periodicidade === "Anual") {
      const key = `${obrigacao.id}-Dezembro`;
      if (!existentesSet.has(key))
        checklistItems.push({ userId, clienteId, obrigacaoId: obrigacao.id, mes: "Dezembro", ano: anoAtual, status: "Pendente" });
    } else if (obrigacao.periodicidade === "Contínuo") {
      for (const mesIdx of [2, 5, 8, 11]) {
        const key = `${obrigacao.id}-${mesesNomes[mesIdx]}`;
        if (!existentesSet.has(key))
          checklistItems.push({ userId, clienteId, obrigacaoId: obrigacao.id, mes: mesesNomes[mesIdx], ano: anoAtual, status: "Pendente" });
      }
    }
  }

  if (checklistItems.length > 0) {
    await db.insert(checklistObrigacoes).values(checklistItems);
  }
  return checklistItems;
}


// Funções de Permissões de Empresas
export async function grantClienteAccess(clienteId: number, userId: number, canView: boolean = true, canEdit: boolean = false, canDelete: boolean = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já existe permissão
  const existing = await db.select().from(clientePermissions)
    .where(and(eq(clientePermissions.clienteId, clienteId), eq(clientePermissions.userId, userId)))
    .limit(1);
  
  if (existing.length > 0) {
    // Atualizar permissão existente
    return await db.update(clientePermissions)
      .set({ canView, canEdit, canDelete, updatedAt: new Date() })
      .where(and(eq(clientePermissions.clienteId, clienteId), eq(clientePermissions.userId, userId)));
  }
  
  // Criar nova permissão
  return await db.insert(clientePermissions).values({
    clienteId,
    userId,
    canView,
    canEdit,
    canDelete,
  });
}

export async function revokeClienteAccess(clienteId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(clientePermissions)
    .where(and(eq(clientePermissions.clienteId, clienteId), eq(clientePermissions.userId, userId)));
}

export async function getClientesByUserWithPermissions(userId: number, isAdmin: boolean = false) {
  const db = await getDb();
  if (!db) return [];

  // Admin vê todos os clientes do sistema
  if (isAdmin) {
    return db.select().from(clientes);
  }

  // Empresas criadas pelo usuário
  const ownedClientes = await db.select().from(clientes).where(eq(clientes.userId, userId));

  // Empresas compartilhadas com o usuário
  const permissions = await db.select().from(clientePermissions).where(eq(clientePermissions.userId, userId));
  const sharedClienteIds = permissions.map(p => p.clienteId);

  let sharedClientes: any[] = [];
  if (sharedClienteIds.length > 0) {
    sharedClientes = await db.select().from(clientes).where(inArray(clientes.id, sharedClienteIds));
  }

  const allClientes = [...ownedClientes, ...sharedClientes];
  return Array.from(new Map(allClientes.map(c => [c.id, c])).values());
}

export async function getClientePermissions(clienteId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(clientePermissions).where(eq(clientePermissions.clienteId, clienteId));
}

export async function getUsersWithClienteAccess(clienteId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const permissions = await db.select().from(clientePermissions).where(eq(clientePermissions.clienteId, clienteId));
  const userIds = permissions.map(p => p.userId);
  
  if (userIds.length === 0) return [];
  
  const userList = await db.select().from(users).where(inArray(users.id, userIds));
  
  // Combinar informações de usuário com permissões
  return userList.map(user => {
    const perm = permissions.find(p => p.userId === user.id);
    return {
      ...user,
      canView: perm?.canView || false,
      canEdit: perm?.canEdit || false,
      canDelete: perm?.canDelete || false,
    };
  });
}

export async function canUserAccessCliente(userId: number, clienteId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Verificar se é o proprietário
  const cliente = await db.select().from(clientes).where(eq(clientes.id, clienteId)).limit(1);
  if (cliente.length > 0 && cliente[0].userId === userId) {
    return true;
  }
  
  // Verificar se tem permissão
  const permission = await db.select().from(clientePermissions)
    .where(and(eq(clientePermissions.clienteId, clienteId), eq(clientePermissions.userId, userId)))
    .limit(1);
  
  return permission.length > 0 && permission[0].canView;
}


// Funções de Auditoria de Acesso
export async function logAuditAction(data: {
  userId: number;
  clienteId: number;
  action: "view" | "create" | "update" | "delete" | "share" | "unshare";
  entityType: "cliente" | "obrigacao" | "mensalidade" | "checklist";
  entityId?: number;
  description?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(auditLog).values({
    userId: data.userId,
    clienteId: data.clienteId,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    description: data.description,
    changes: data.changes ? JSON.stringify(data.changes) : null,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });
}

export async function getAuditLogByCliente(clienteId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(auditLog)
    .where(eq(auditLog.clienteId, clienteId))
    .orderBy(auditLog.timestamp)
    .limit(limit);
}

export async function getAuditLogByUser(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(auditLog)
    .where(eq(auditLog.userId, userId))
    .orderBy(auditLog.timestamp)
    .limit(limit);
}

export async function getAuditLogByAction(action: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(auditLog)
    .where(eq(auditLog.action, action as any))
    .orderBy(auditLog.timestamp)
    .limit(limit);
}

export async function getAuditLogByDateRange(startDate: Date, endDate: Date, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  const { gte, lte } = require("drizzle-orm");
  
  return await db.select().from(auditLog)
    .where(and(
      gte(auditLog.timestamp, startDate),
      lte(auditLog.timestamp, endDate)
    ))
    .orderBy(auditLog.timestamp)
    .limit(limit);
}

export async function getAllAuditLogs(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(auditLog)
    .orderBy(auditLog.timestamp)
    .limit(limit);
}


// ===== FUNÇÕES DE BACKUP E SINCRONIZAÇÃO =====

// Fazer backup de um cliente
export async function backupCliente(clienteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const cliente = await db.select().from(clientes).where(eq(clientes.id, clienteId)).limit(1);
  if (!cliente || cliente.length === 0) return null;
  
  const backupData = cliente[0];
  
  // Inserir no backup (ou atualizar se já existe)
  await db.insert(clientesBackup).values({
    ...backupData,
    backupedAt: new Date(),
  }).onDuplicateKeyUpdate({
    set: {
      nome: backupData.nome,
      email: backupData.email,
      regime: backupData.regime,
      setor: backupData.setor,
      valor: backupData.valor,
      vencimento: backupData.vencimento,
      status: backupData.status,
      updatedAt: backupData.updatedAt,
      backupedAt: new Date(),
    },
  });
  
  return backupData;
}

// Fazer backup de todos os clientes
export async function backupAllClientes() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const allClientes = await db.select().from(clientes);
  
  for (const cliente of allClientes) {
    await backupCliente(cliente.id);
  }
  
  return allClientes.length;
}

// Registrar sincronização
export async function logSync(entityType: string, entityId: number, action: string, status: string, errorMessage?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(syncLog).values({
    entityType: entityType as any,
    entityId,
    action: action as any,
    status: status as any,
    errorMessage,
    createdAt: new Date(),
    syncedAt: status === 'synced' ? new Date() : null,
  });
}

// Obter logs de sincronização pendentes
export async function getPendingSyncLogs() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(syncLog).where(eq(syncLog.status, 'pending'));
}

// Obter logs de sincronização com erro
export async function getFailedSyncLogs() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(syncLog).where(eq(syncLog.status, 'failed'));
}

// Atualizar status de sincronização
export async function updateSyncStatus(syncLogId: number, status: string, errorMessage?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(syncLog)
    .set({
      status: status as any,
      errorMessage,
      syncedAt: status === 'synced' ? new Date() : null,
    })
    .where(eq(syncLog.id, syncLogId));
}

// Obter estatísticas de sincronização
export async function getSyncStats() {
  const db = await getDb();
  if (!db) return { total: 0, synced: 0, pending: 0, failed: 0 };
  
  const all = await db.select().from(syncLog);
  const synced = all.filter(log => log.status === 'synced').length;
  const pending = all.filter(log => log.status === 'pending').length;
  const failed = all.filter(log => log.status === 'failed').length;
  
  return {
    total: all.length,
    synced,
    pending,
    failed,
  };
}

// Restaurar cliente do backup
export async function restoreClienteFromBackup(clienteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const backup = await db.select().from(clientesBackup).where(eq(clientesBackup.id, clienteId)).limit(1);
  if (!backup || backup.length === 0) return null;
  
  const backupData = backup[0];
  
  // Atualizar cliente com dados do backup
  const result = await db.update(clientes)
    .set({
      nome: backupData.nome,
      email: backupData.email,
      regime: backupData.regime,
      setor: backupData.setor,
      valor: backupData.valor,
      vencimento: backupData.vencimento,
      status: backupData.status,
      updatedAt: new Date(),
    })
    .where(eq(clientes.id, clienteId));
  
  return result;
}

// Obter todos os backups
export async function getAllBackups() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(clientesBackup);
}

// Obter backup por ID
export async function getBackupById(clienteId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const backup = await db.select().from(clientesBackup).where(eq(clientesBackup.id, clienteId)).limit(1);
  return backup && backup.length > 0 ? backup[0] : null;
}

// ===== DOCUMENTOS =====

export async function getDocumentosByUser(userId: number, isAdmin: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  const clienteIds = await getAccessibleClienteIds(userId, isAdmin);
  if (clienteIds.length === 0) return [];
  return db.select({
    id: documentos.id,
    userId: documentos.userId,
    clienteId: documentos.clienteId,
    pasta: documentos.pasta,
    nome: documentos.nome,
    descricao: documentos.descricao,
    tipo: documentos.tipo,
    tamanho: documentos.tamanho,
    createdAt: documentos.createdAt,
    updatedAt: documentos.updatedAt,
  }).from(documentos).where(inArray(documentos.clienteId, clienteIds));
}

export async function getDocumentosByCliente(clienteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: documentos.id,
    userId: documentos.userId,
    clienteId: documentos.clienteId,
    pasta: documentos.pasta,
    nome: documentos.nome,
    descricao: documentos.descricao,
    tipo: documentos.tipo,
    tamanho: documentos.tamanho,
    createdAt: documentos.createdAt,
    updatedAt: documentos.updatedAt,
  }).from(documentos).where(eq(documentos.clienteId, clienteId));
}

export async function getDocumentoConteudo(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(documentos).where(eq(documentos.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createDocumento(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(documentos).values(data);
}

export async function deleteDocumento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(documentos).where(eq(documentos.id, id));
}

export async function getServicosPrestadosByCliente(clienteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(servicosPrestados).where(eq(servicosPrestados.clienteId, clienteId));
}

// ===== PORTAL FLUXO DE CAIXA =====

export async function getPortalFluxoCaixaByCliente(clienteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portalFluxoCaixa).where(eq(portalFluxoCaixa.clienteId, clienteId));
}

export async function createPortalFluxoCaixa(data: {
  clienteId: number;
  tipo: "entrada" | "saida";
  descricao: string;
  valor: string;
  mes: string;
  ano: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(portalFluxoCaixa).values(data);
  return result;
}

export async function deletePortalFluxoCaixa(id: number, clienteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(portalFluxoCaixa).where(
    and(eq(portalFluxoCaixa.id, id), eq(portalFluxoCaixa.clienteId, clienteId))
  );
}

export async function renamePastaDocumentos(clienteId: number, oldNome: string, newNome: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(documentos)
    .set({ pasta: newNome })
    .where(and(eq(documentos.clienteId, clienteId), eq(documentos.pasta, oldNome)));
}

// ===== SERVIÇOS PRESTADOS =====

export async function getServicosPrestadosByUser(userId: number, isAdmin: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  const clienteIds = await getAccessibleClienteIds(userId, isAdmin);
  if (clienteIds.length === 0) return [];
  return db.select().from(servicosPrestados).where(inArray(servicosPrestados.clienteId, clienteIds));
}

export async function getServicosPrestadosByUserAndMonth(userId: number, mes: string, ano: number, isAdmin: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  const clienteIds = await getAccessibleClienteIds(userId, isAdmin);
  if (clienteIds.length === 0) return [];
  return db.select().from(servicosPrestados).where(
    and(
      inArray(servicosPrestados.clienteId, clienteIds),
      eq(servicosPrestados.mes, mes),
      eq(servicosPrestados.ano, ano)
    )
  );
}

export async function createServicoPrestado(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(servicosPrestados).values(data);
}

export async function updateServicoPrestado(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(servicosPrestados).set(data).where(eq(servicosPrestados.id, id));
}

export async function deleteServicoPrestado(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(servicosPrestados).where(eq(servicosPrestados.id, id));
}

// ===== ACESSOS DAS EMPRESAS =====

export async function getAcessosByUser(userId: number, isAdmin: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  const clienteIds = await getAccessibleClienteIds(userId, isAdmin);
  if (clienteIds.length === 0) return [];
  return db.select().from(acessosEmpresas).where(inArray(acessosEmpresas.clienteId, clienteIds));
}

export async function getAcessosByCliente(clienteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(acessosEmpresas).where(eq(acessosEmpresas.clienteId, clienteId));
}

export async function createAcesso(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(acessosEmpresas).values(data);
}

export async function updateAcesso(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(acessosEmpresas).set(data).where(eq(acessosEmpresas.id, id));
}

export async function deleteAcesso(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(acessosEmpresas).where(eq(acessosEmpresas.id, id));
}

// ===== FLUXO DE CAIXA =====

const MESES_LISTA = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export async function getFluxoCaixaSummary(userId: number, mes: string, ano: number, isAdmin: boolean = false, responsavelId?: number) {
  const db = await getDb();
  if (!db) return { recebido: 0, pendente: 0, atrasado: 0, mensalidadesRecebido: 0, servicosRecebido: 0 };

  const clienteIds = await getAccessibleClienteIds(userId, isAdmin);
  if (clienteIds.length === 0) return { recebido: 0, pendente: 0, atrasado: 0, mensalidadesRecebido: 0, servicosRecebido: 0 };

  let filteredClienteIds = clienteIds;
  if (responsavelId) {
    const clientesDoResponsavel = await db.select({ id: clientes.id })
      .from(clientes)
      .where(and(inArray(clientes.id, clienteIds), eq(clientes.responsavelId, responsavelId)));
    filteredClienteIds = clientesDoResponsavel.map(c => c.id);
  }

  if (filteredClienteIds.length === 0) return { recebido: 0, pendente: 0, atrasado: 0, mensalidadesRecebido: 0, servicosRecebido: 0 };

  const mensalidades = await db.select().from(controleMensalidades).where(
    and(inArray(controleMensalidades.clienteId, filteredClienteIds), eq(controleMensalidades.mes, mes), eq(controleMensalidades.ano, ano))
  );

  const servicos = await db.select().from(servicosPrestados).where(
    and(inArray(servicosPrestados.clienteId, filteredClienteIds), eq(servicosPrestados.mes, mes), eq(servicosPrestados.ano, ano))
  );

  let recebido = 0, pendente = 0, atrasado = 0, mensalidadesRecebido = 0, servicosRecebido = 0;

  for (const m of mensalidades) {
    const v = parseFloat(m.valor?.toString() ?? "0");
    if (m.status === "Pago") { recebido += v; mensalidadesRecebido += v; }
    else if (m.status === "Pendente") pendente += v;
    else if (m.status === "Atrasado") atrasado += v;
  }

  for (const s of servicos) {
    const v = parseFloat(s.valor?.toString() ?? "0");
    if (s.status === "Pago") { recebido += v; servicosRecebido += v; }
    else if (s.status === "Pendente") pendente += v;
    else if (s.status === "Atrasado") atrasado += v;
  }

  return { recebido, pendente, atrasado, mensalidadesRecebido, servicosRecebido };
}

export async function getFluxoCaixaAnual(userId: number, ano: number, isAdmin: boolean = false, responsavelId?: number) {
  const db = await getDb();
  if (!db) return [];

  const clienteIds = await getAccessibleClienteIds(userId, isAdmin);
  if (clienteIds.length === 0) return MESES_LISTA.map(mes => ({ mes, recebido: 0, pendente: 0, atrasado: 0 }));

  let filteredClienteIds = clienteIds;
  if (responsavelId) {
    const clientesDoResponsavel = await db.select({ id: clientes.id })
      .from(clientes)
      .where(and(inArray(clientes.id, clienteIds), eq(clientes.responsavelId, responsavelId)));
    filteredClienteIds = clientesDoResponsavel.map(c => c.id);
  }

  if (filteredClienteIds.length === 0) return MESES_LISTA.map(mes => ({ mes, recebido: 0, pendente: 0, atrasado: 0 }));

  const mensalidades = await db.select().from(controleMensalidades).where(
    and(inArray(controleMensalidades.clienteId, filteredClienteIds), eq(controleMensalidades.ano, ano))
  );

  const servicos = await db.select().from(servicosPrestados).where(
    and(inArray(servicosPrestados.clienteId, filteredClienteIds), eq(servicosPrestados.ano, ano))
  );

  return MESES_LISTA.map(mes => {
    let recebido = 0, pendente = 0, atrasado = 0;

    for (const m of mensalidades.filter(x => x.mes === mes)) {
      const v = parseFloat(m.valor?.toString() ?? "0");
      if (m.status === "Pago") recebido += v;
      else if (m.status === "Pendente") pendente += v;
      else if (m.status === "Atrasado") atrasado += v;
    }

    for (const s of servicos.filter(x => x.mes === mes)) {
      const v = parseFloat(s.valor?.toString() ?? "0");
      if (s.status === "Pago") recebido += v;
      else if (s.status === "Pendente") pendente += v;
      else if (s.status === "Atrasado") atrasado += v;
    }

    return { mes, recebido, pendente, atrasado };
  });
}

export async function getFluxoCaixaTransacoes(userId: number, mes: string, ano: number, isAdmin: boolean = false, responsavelId?: number) {
  const db = await getDb();
  if (!db) return [];

  const clienteIds = await getAccessibleClienteIds(userId, isAdmin);
  if (clienteIds.length === 0) return [];

  let filteredClienteIds = clienteIds;
  if (responsavelId) {
    const clientesDoResponsavel = await db.select({ id: clientes.id })
      .from(clientes)
      .where(and(inArray(clientes.id, clienteIds), eq(clientes.responsavelId, responsavelId)));
    filteredClienteIds = clientesDoResponsavel.map(c => c.id);
  }

  if (filteredClienteIds.length === 0) return [];

  const clientesList = await db.select().from(clientes).where(inArray(clientes.id, filteredClienteIds));
  const clienteMap = new Map(clientesList.map(c => [c.id, c.nome]));

  const mensalidades = await db.select().from(controleMensalidades).where(
    and(inArray(controleMensalidades.clienteId, filteredClienteIds), eq(controleMensalidades.mes, mes), eq(controleMensalidades.ano, ano))
  );

  const servicos = await db.select().from(servicosPrestados).where(
    and(inArray(servicosPrestados.clienteId, filteredClienteIds), eq(servicosPrestados.mes, mes), eq(servicosPrestados.ano, ano))
  );

  const transacoes = [
    ...mensalidades.map(m => ({
      id: m.id,
      tipo: "Mensalidade" as const,
      descricao: "Mensalidade",
      clienteId: m.clienteId,
      cliente: clienteMap.get(m.clienteId ?? 0) ?? "-",
      valor: parseFloat(m.valor?.toString() ?? "0"),
      status: m.status,
      dataPagamento: m.dataPagamento,
      mes: m.mes,
      ano: m.ano,
    })),
    ...servicos.map(s => ({
      id: s.id,
      tipo: "Serviço" as const,
      descricao: s.nomeServico,
      clienteId: s.clienteId,
      cliente: clienteMap.get(s.clienteId ?? 0) ?? "-",
      valor: parseFloat(s.valor?.toString() ?? "0"),
      status: s.status,
      dataPagamento: s.dataPagamento,
      mes: s.mes,
      ano: s.ano,
    })),
  ];

  return transacoes.sort((a, b) => a.cliente.localeCompare(b.cliente));
}

// ===== RESPONSÁVEIS =====

export async function getResponsaveisByUser(userId: number, isAdmin: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  if (isAdmin) return db.select().from(responsaveis);
  return db.select().from(responsaveis).where(eq(responsaveis.userId, userId));
}

export async function createResponsavel(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(responsaveis).values(data);
}

export async function updateResponsavel(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(responsaveis).set(data).where(eq(responsaveis.id, id));
}

export async function deleteResponsavel(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(responsaveis).where(eq(responsaveis.id, id));
}

export async function getSociosByCliente(clienteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(socios).where(eq(socios.clienteId, clienteId));
}

export async function createSocio(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(socios).values(data);
}

export async function updateSocio(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(socios).set(data).where(eq(socios.id, id));
}

export async function deleteSocio(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(socios).where(eq(socios.id, id));
}

// ===== PORTAL DE CLIENTES =====

export async function getPortalClienteByClienteId(clienteId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(portalClientes).where(eq(portalClientes.clienteId, clienteId)).limit(1);
  return result[0] ?? undefined;
}

export async function getPortalClienteByCnpj(cnpj: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(portalClientes).where(eq(portalClientes.cnpj, cnpj)).limit(1);
  return result[0] ?? undefined;
}

export async function createPortalCliente(clienteId: number, cnpj: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getPortalClienteByClienteId(clienteId);
  if (existing) throw new Error("Acesso já existe para esta empresa");
  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(portalClientes).values({ clienteId, cnpj, passwordHash, ativo: true });
  return getPortalClienteByClienteId(clienteId);
}

export async function updatePortalClientePassword(clienteId: number, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(portalClientes).set({ passwordHash }).where(eq(portalClientes.clienteId, clienteId));
}

export async function togglePortalCliente(clienteId: number, ativo: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(portalClientes).set({ ativo }).where(eq(portalClientes.clienteId, clienteId));
}

export async function deletePortalCliente(clienteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(portalClientes).where(eq(portalClientes.clienteId, clienteId));
}

export async function updatePortalFluxoConfig(clienteId: number, mostrarMensalidades: boolean, mostrarServicos: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(portalClientes)
    .set({ mostrarMensalidades, mostrarServicos })
    .where(eq(portalClientes.clienteId, clienteId));
}

export async function verifyPortalClientePassword(cnpj: string, password: string) {
  const portal = await getPortalClienteByCnpj(cnpj);
  if (!portal || !portal.ativo) return null;
  const isValid = await bcrypt.compare(password, portal.passwordHash);
  if (!isValid) return null;
  return portal;
}
