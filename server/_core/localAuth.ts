/**
 * Autenticação Local para Desenvolvimento
 * 
 * Este módulo fornece autenticação simplificada para desenvolvimento local
 * sem dependência de OAuth externo. Útil para testes e desenvolvimento em ambiente interno.
 * 
 * Em produção com OAuth, este módulo NÃO é usado.
 */

import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

const DEMO_USER_ID = "local-demo-user";
const DEMO_ADMIN_ID = "local-admin-user";

/**
 * Retorna um usuário de demonstração para desenvolvimento local.
 * Sempre retorna o mesmo usuário (admin) para testes.
 */
export async function getLocalDemoUser(): Promise<User> {
  let user = await db.getUserByOpenId(DEMO_ADMIN_ID);
  
  if (!user) {
    // Cria o usuário de demo na primeira execução
    await db.upsertUser({
      openId: DEMO_ADMIN_ID,
      name: "Admin Local",
      email: "admin@local.dev",
      loginMethod: "local-dev",
      role: "admin",
      lastSignedIn: new Date(),
    });
    user = await db.getUserByOpenId(DEMO_ADMIN_ID);
  }

  if (!user) {
    throw new Error("Falha ao criar usuário de demo");
  }

  return user;
}

/**
 * Autentica uma requisição em modo desenvolvimento local.
 * Retorna sempre o usuário admin de demo.
 */
export async function authenticateLocalRequest(req: Request): Promise<User> {
  // Em modo local, sempre retorna o usuário admin
  const user = await getLocalDemoUser();
  
  // Atualiza lastSignedIn
  await db.upsertUser({
    openId: user.openId,
    lastSignedIn: new Date(),
  });

  return user;
}
