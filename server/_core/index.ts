import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  const url = process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL;
  if (!url) return;
  console.log(`[migrate] Usando: ${url.replace(/:\/\/.*@/, "://*****@")}`);

  const migrationsFolder = path.resolve(__dirname, "../../drizzle");

  for (let i = 1; i <= 10; i++) {
    try {
      console.log(`[migrate] Tentativa ${i}/10...`);
      const connection = await mysql.createConnection(url);

      await connection.execute(`
        CREATE TABLE IF NOT EXISTS __drizzle_migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          hash TEXT NOT NULL,
          created_at BIGINT
        )
      `);

      const [rows] = await connection.execute("SELECT hash FROM __drizzle_migrations");
      const applied = new Set((rows as { hash: string }[]).map(r => r.hash));

      const journal = JSON.parse(fs.readFileSync(path.join(migrationsFolder, "meta/_journal.json"), "utf-8"));

      for (const entry of journal.entries) {
        const tag = entry.tag as string;
        if (applied.has(tag)) continue;

        const sql = fs.readFileSync(path.join(migrationsFolder, `${tag}.sql`), "utf-8");
        const statements = sql.split("--> statement-breakpoint").map((s: string) => s.trim()).filter((s: string) => s.length > 0);

        console.log(`[migrate] Aplicando ${tag}...`);
        for (const stmt of statements) {
          try {
            await connection.execute(stmt);
          } catch (err: any) {
            if (["ER_DUP_FIELDNAME", "ER_TABLE_EXISTS_ERROR", "ER_DUP_KEYNAME"].includes(err.code)) {
              console.warn(`[migrate] Aviso (${err.code}): ${err.message}`);
            } else throw err;
          }
        }

        await connection.execute("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)", [tag, Date.now()]);
        console.log(`[migrate] ✓ ${tag}`);
      }

      await connection.end();
      console.log("[migrate] Concluído!");
      return;
    } catch (err: any) {
      if (i < 10) {
        console.warn(`[migrate] Falhou (${err.code}), aguardando 3s...`);
        await new Promise(r => setTimeout(r, 3000));
      } else {
        console.error("[migrate] Erro fatal:", err.message);
      }
    }
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    runMigrations().catch(err => console.error("[migrate]", err));
  });
}

startServer().catch(console.error);
