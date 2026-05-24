import "dotenv/config";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../drizzle");

const url = process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL;
if (!url) {
  console.warn("[migrate] DATABASE_URL não configurado, pulando migrações.");
  process.exit(0);
}

async function connectWithRetry(retries = 10, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`[migrate] Tentativa ${i}/${retries} de conexão...`);
      return await mysql.createConnection(url!);
    } catch (err: any) {
      if (i === retries) throw err;
      console.warn(`[migrate] Falhou (${err.code}), aguardando ${delayMs}ms...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error("Não foi possível conectar ao banco");
}

try {
  const connection = await connectWithRetry();
  console.log("[migrate] Conexão estabelecida.");

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hash TEXT NOT NULL,
      created_at BIGINT
    )
  `);

  const [rows] = await connection.execute("SELECT hash FROM __drizzle_migrations");
  const applied = new Set((rows as { hash: string }[]).map(r => r.hash));
  console.log(`[migrate] Migrações já aplicadas: ${applied.size}`);

  const journalPath = path.join(migrationsFolder, "meta/_journal.json");
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8"));

  for (const entry of journal.entries) {
    const tag = entry.tag as string;

    if (applied.has(tag)) {
      console.log(`[migrate] Pulando (já aplicado): ${tag}`);
      continue;
    }

    const sqlPath = path.join(migrationsFolder, `${tag}.sql`);
    const sql = fs.readFileSync(sqlPath, "utf-8");

    const statements = sql
      .split("--> statement-breakpoint")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`[migrate] Aplicando ${tag} (${statements.length} statements)...`);

    for (const stmt of statements) {
      try {
        await connection.execute(stmt);
      } catch (err: any) {
        if (["ER_DUP_FIELDNAME", "ER_TABLE_EXISTS_ERROR", "ER_DUP_KEYNAME"].includes(err.code)) {
          console.warn(`[migrate]   Aviso (${err.code}): ${err.message}`);
        } else {
          console.error(`[migrate]   ERRO no statement: ${stmt.slice(0, 100)}`);
          throw err;
        }
      }
    }

    await connection.execute(
      "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
      [tag, Date.now()]
    );
    console.log(`[migrate] ✓ ${tag}`);
  }

  await connection.end();
  console.log("[migrate] Todas as migrações aplicadas com sucesso!");
} catch (err) {
  console.error("[migrate] ERRO FATAL:", err);
}

process.exit(0);
