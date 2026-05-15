import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  /** Hash da senha para autenticação local (bcrypt) */
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabela de Clientes
export const clientes = mysqlTable("clientes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  regime: mysqlEnum("regime", ["Simples", "Lucro Presumido", "Lucro Real", "MEI"]).notNull(),
  setor: mysqlEnum("setor", ["Fiscal", "Trabalhista", "Contábil", "Geral"]).default("Geral"),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  vencimento: int("vencimento").notNull(), // 10 ou 20
  status: mysqlEnum("status", ["Ativo", "Inativo"]).default("Ativo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = typeof clientes.$inferInsert;

// Tabela de Obrigações
export const obrigacoes = mysqlTable("obrigacoes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  categoria: mysqlEnum("categoria", ["Fiscal", "Acessória", "Trabalhista", "Outra"]).notNull(),
  periodicidade: mysqlEnum("periodicidade", ["Mensal", "Anual", "Contínuo"]).notNull(),
  vencimento: int("vencimento"), // dia do mês
  regime: mysqlEnum("regime", ["Simples", "Todos", "Com Funcionários", "MEI"]).notNull(),
  descricao: text("descricao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Obrigacao = typeof obrigacoes.$inferSelect;
export type InsertObrigacao = typeof obrigacoes.$inferInsert;

// Tabela de Checklist de Obrigações (Controle Mensal)
export const checklistObrigacoes = mysqlTable("checklist_obrigacoes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clienteId: int("clienteId").notNull(),
  obrigacaoId: int("obrigacaoId").notNull(),
  mes: varchar("mes", { length: 10 }).notNull(), // Jan, Fev, Mar, etc.
  ano: int("ano").notNull(),
  status: mysqlEnum("status", ["Feito", "Pendente", "Em Progresso", "Bloqueado", "N/A"]).default("Pendente"),
  responsavel: varchar("responsavel", { length: 255 }),
  horaInicial: varchar("horaInicial", { length: 5 }), // HH:MM
  horaFinal: varchar("horaFinal", { length: 5 }), // HH:MM
  totalHoras: decimal("totalHoras", { precision: 5, scale: 2 }),
  dataConlusao: timestamp("dataConlusao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChecklistObrigacao = typeof checklistObrigacoes.$inferSelect;
export type InsertChecklistObrigacao = typeof checklistObrigacoes.$inferInsert;

// Tabela de Controle de Mensalidades
export const controleMensalidades = mysqlTable("controle_mensalidades", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clienteId: int("clienteId").notNull(),
  mes: varchar("mes", { length: 10 }).notNull(), // Jan, Fev, Mar, etc.
  ano: int("ano").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["Pago", "Pendente", "Atrasado"]).default("Pendente"),
  dataPagamento: timestamp("dataPagamento"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ControleMensalidade = typeof controleMensalidades.$inferSelect;
export type InsertControleMensalidade = typeof controleMensalidades.$inferInsert;

// Tabela de Configurações de Notificações
export const notificacaoConfigs = mysqlTable("notificacao_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ativarMensalidades: boolean("ativarMensalidades").default(true).notNull(),
  diasAntecedencia: int("diasAntecedencia").default(3).notNull(), // Dias antes do vencimento
  ativarObrigacoes: boolean("ativarObrigacoes").default(true).notNull(),
  ativarChecklist: boolean("ativarChecklist").default(true).notNull(),
  horarioEnvio: varchar("horarioEnvio", { length: 5 }).default("09:00").notNull(), // HH:mm
  frequencia: mysqlEnum("frequencia", ["Diaria", "Semanal", "Mensal"]).default("Diaria").notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificacaoConfig = typeof notificacaoConfigs.$inferSelect;
export type InsertNotificacaoConfig = typeof notificacaoConfigs.$inferInsert;

// Tabela de Permissões de Acesso a Empresas
export const clientePermissions = mysqlTable("cliente_permissions", {
  id: int("id").autoincrement().primaryKey(),
  clienteId: int("clienteId").notNull(),
  userId: int("userId").notNull(),
  canView: boolean("canView").default(true).notNull(),
  canEdit: boolean("canEdit").default(false).notNull(),
  canDelete: boolean("canDelete").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientePermission = typeof clientePermissions.$inferSelect;
export type InsertClientePermission = typeof clientePermissions.$inferInsert;
