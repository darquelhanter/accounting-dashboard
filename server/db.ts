import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, clientes, obrigacoes, checklistObrigacoes, controleMensalidades } from "../drizzle/schema";
import { ENV } from './_core/env';

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
  return db.insert(clientes).values(data);
}

export async function updateCliente(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(clientes).set(data).where(eq(clientes.id, id));
}

export async function deleteCliente(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(clientes).where(eq(clientes.id, id));
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
  return db.update(obrigacoes).set(data).where(eq(obrigacoes.id, id));
}

export async function deleteObrigacao(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(obrigacoes).where(eq(obrigacoes.id, id));
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
      eq(checklistObrigacoes.userId, userId) &&
      eq(checklistObrigacoes.mes, mes) &&
      eq(checklistObrigacoes.ano, ano)
    );
}

export async function getChecklistByCliente(clienteId: number, mes: string, ano: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checklistObrigacoes)
    .where(
      eq(checklistObrigacoes.clienteId, clienteId) &&
      eq(checklistObrigacoes.mes, mes) &&
      eq(checklistObrigacoes.ano, ano)
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
  return db.update(checklistObrigacoes).set(data).where(eq(checklistObrigacoes.id, id));
}

export async function deleteChecklistItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(checklistObrigacoes).where(eq(checklistObrigacoes.id, id));
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
  return db.update(controleMensalidades).set(data).where(eq(controleMensalidades.id, id));
}

export async function deleteMensalidade(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(controleMensalidades).where(eq(controleMensalidades.id, id));
}

export async function getMensalidadesByUserAndMonth(userId: number, mes: string, ano: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(controleMensalidades)
    .where(
      eq(controleMensalidades.userId, userId) &&
      eq(controleMensalidades.mes, mes) &&
      eq(controleMensalidades.ano, ano)
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
