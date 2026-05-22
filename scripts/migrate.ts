import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../drizzle");

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn("[migrate] DATABASE_URL não configurado, pulando migrações.");
  process.exit(0);
}

try {
  console.log("[migrate] Aplicando migrações...");
  const connection = await mysql.createConnection(url);
  const db = drizzle(connection);
  await migrate(db, { migrationsFolder });
  await connection.end();
  console.log("[migrate] Migrações aplicadas com sucesso!");
} catch (err) {
  console.error("[migrate] Erro ao aplicar migrações:", err);
}

process.exit(0);
