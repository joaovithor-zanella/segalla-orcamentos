/**
 * Script de Inicialização do Banco de Dados
 * 
 * Cria o usuário admin local na primeira execução
 * Execute com: pnpm tsx server/init-db.ts
 */

import * as db from "./db";

async function initializeDatabase() {
  console.log("[Init DB] Iniciando banco de dados...");

  try {
    // Criar usuário admin local
    const ADMIN_ID = "local-admin-user";
    
    const existingUser = await db.getUserByOpenId(ADMIN_ID);
    
    if (existingUser) {
      console.log("[Init DB] ✓ Usuário admin já existe");
    } else {
      console.log("[Init DB] Criando usuário admin local...");
      
      await db.upsertUser({
        openId: ADMIN_ID,
        name: "Admin Local",
        email: "admin@local.dev",
        loginMethod: "local-dev",
        role: "admin",
        lastSignedIn: new Date(),
      });

      const newUser = await db.getUserByOpenId(ADMIN_ID);
      
      if (newUser) {
        console.log("[Init DB] ✓ Usuário admin criado com sucesso");
        console.log(`[Init DB]   ID: ${newUser.id}`);
        console.log(`[Init DB]   Nome: ${newUser.name}`);
        console.log(`[Init DB]   Email: ${newUser.email}`);
        console.log(`[Init DB]   Role: ${newUser.role}`);
      } else {
        throw new Error("Falha ao criar usuário admin");
      }
    }

    console.log("[Init DB] ✓ Banco de dados inicializado com sucesso");
    process.exit(0);
  } catch (error) {
    console.error("[Init DB] ✗ Erro ao inicializar banco de dados:", error);
    process.exit(1);
  }
}

initializeDatabase();
