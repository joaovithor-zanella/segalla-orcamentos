/**
 * ============================================================
 * GERENCIADOR DE AUTENTICAÇÃO LOCAL
 * Responsável por criar, editar, deletar usuários e validar senhas
 * ============================================================
 */

import crypto from "crypto";

// Usar bcrypt seria ideal, mas para simplicidade usamos crypto
// Em produção, instale: npm install bcrypt
// import bcrypt from "bcrypt";

/**
 * Hash simples de senha usando PBKDF2
 * Em produção, use bcrypt: await bcrypt.hash(password, 10)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifica se a senha está correta
 * Em produção, use bcrypt: await bcrypt.compare(password, hash)
 */
export function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(":");
  if (!salt || !storedHash) return false;

  const computedHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");

  return computedHash === storedHash;
}

/**
 * Tipos para gerenciamento de usuários
 */
export interface CreateUserInput {
  username: string;
  password: string;
  name: string;
  role: "admin" | "user";
  canViewOtherQuotes?: "yes" | "no";
}

export interface UpdateUserInput {
  name?: string;
  password?: string;
  role?: "admin" | "user";
  canViewOtherQuotes?: "yes" | "no";
  active?: "yes" | "no";
}

export interface LocalUser {
  id: number;
  username: string;
  name: string;
  role: "admin" | "user";
  canViewOtherQuotes: "yes" | "no";
  active: "yes" | "no";
  createdAt: Date;
}
