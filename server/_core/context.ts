import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  clientePortal: { clienteId: number; cnpj: string } | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let clientePortal: { clienteId: number; cnpj: string } | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  try {
    clientePortal = await sdk.authenticatePortalRequest(opts.req);
  } catch {
    clientePortal = null;
  }

  return { req: opts.req, res: opts.res, user, clientePortal };
}
