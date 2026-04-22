/**
 * Testes do sistema Segalla de Orçamentos
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createCtx(overrides?: Partial<User>): TrpcContext {
  const user: User = {
    id: 1,
    openId: "test-user-001",
    name: "Usuário Teste",
    email: "teste@segalla.com.br",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminCtx(): TrpcContext {
  return createCtx({ id: 99, openId: "admin-001", name: "Admin", role: "admin" });
}

// ─── Auth tests ───────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("retorna o usuário autenticado", async () => {
    const ctx = createCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result?.openId).toBe("test-user-001");
    expect(result?.role).toBe("user");
  });

  it("retorna null quando não autenticado", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("auth.logout", () => {
  it("limpa o cookie de sessão e retorna sucesso", async () => {
    const ctx = createCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(ctx.res.clearCookie).toHaveBeenCalledWith(
      COOKIE_NAME,
      expect.objectContaining({ maxAge: -1 })
    );
  });
});

// ─── Users router (admin only) ────────────────────────────────────────────────

describe("users router - controle de acesso", () => {
  it("bloqueia usuário comum de listar usuários", async () => {
    const ctx = createCtx({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.users.list()).rejects.toThrow();
  });

  it("bloqueia usuário comum de excluir usuários", async () => {
    const ctx = createCtx({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.users.delete({ id: 2 })).rejects.toThrow();
  });

  it("bloqueia admin de excluir a própria conta", async () => {
    const ctx = createAdminCtx();
    const caller = appRouter.createCaller(ctx);
    // Admin tem id=99, tentando excluir id=99 (si mesmo)
    await expect(caller.users.delete({ id: 99 })).rejects.toThrow();
  });
});

// ─── Payment methods router ───────────────────────────────────────────────────

describe("paymentMethods router - controle de acesso", () => {
  it("bloqueia usuário comum de criar forma de pagamento", async () => {
    const ctx = createCtx({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.paymentMethods.create({ name: "Teste" })
    ).rejects.toThrow();
  });

  it("bloqueia usuário comum de excluir forma de pagamento", async () => {
    const ctx = createCtx({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.paymentMethods.delete({ id: 1 })).rejects.toThrow();
  });

  it("bloqueia usuário não autenticado de listar formas de pagamento", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.paymentMethods.list({ activeOnly: true })).rejects.toThrow();
  });
});

// ─── Quotes router ────────────────────────────────────────────────────────────

describe("quotes router - controle de acesso", () => {
  it("bloqueia usuário não autenticado de criar orçamento", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.quotes.create({
        items: [
          { productCode: "001", productName: "Produto Teste", quantity: 1, unitPrice: 10 },
        ],
      })
    ).rejects.toThrow();
  });

  it("bloqueia usuário não autenticado de listar orçamentos", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.quotes.list()).rejects.toThrow();
  });
});

// ─── Products router ──────────────────────────────────────────────────────────

describe("products router - controle de acesso", () => {
  it("bloqueia usuário não autenticado de buscar produtos", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.products.search({ search: "filtro" })).rejects.toThrow();
  });

  it("bloqueia usuário comum de testar conexão Firebird", async () => {
    const ctx = createCtx({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.products.testConnection()).rejects.toThrow();
  });
});
