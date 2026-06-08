#!/usr/bin/env node

/**
 * Script para limpar usuários antigos (sem openId) e criar novo admin
 * Use: node reset-users.mjs
 */

import { createConnection } from "mysql2/promise";
import { hashPassword } from "./server/localAuthManager.ts";
import { nanoid } from "nanoid";

const DB_CONFIG = {
  host: process.env.DATABASE_URL?.split("@")[1]?.split(":")[0] || "localhost",
  user: process.env.DATABASE_URL?.split("://")[1]?.split(":")[0] || "root",
  password: process.env.DATABASE_URL?.split(":")[1]?.split("@")[0] || "password",
  database: process.env.DATABASE_URL?.split("/")[3]?.split("?")[0] || "segalla_orcamentos",
};

async function main() {
  let connection;
  try {
    console.log("🔌 Conectando ao banco de dados...");
    connection = await createConnection(DB_CONFIG);

    // Deleta usuários sem openId
    console.log("🗑️  Deletando usuários antigos (sem openId)...");
    const [deleteResult] = await connection.execute(
      "DELETE FROM users WHERE openId IS NULL OR openId = ''"
    );
    console.log(`✅ Deletados ${deleteResult.affectedRows} usuários antigos`);

    // Cria novo admin
    console.log("👤 Criando novo usuário admin...");
    const openId = `local-user-${nanoid(12)}`;
    const passwordHash = hashPassword("Segalla@2025");

    await connection.execute(
      `INSERT INTO users (openId, username, passwordHash, name, email, role, loginMethod, active, canViewOtherQuotes, lastSignedIn, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
      [
        openId,
        "admin",
        passwordHash,
        "Administrador",
        "admin@segalla.local",
        "admin",
        "local",
        "yes",
        "yes",
      ]
    );
    console.log("✅ Usuário admin criado com sucesso!");
    console.log("\n📋 Credenciais:");
    console.log("   Username: admin");
    console.log("   Senha: Segalla@2025");
    console.log("\n🚀 Agora você pode fazer login no sistema!");

    await connection.end();
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

main();
