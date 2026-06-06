import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getAllUsers,
  getUserById,
  getUserByOpenId,
  getUserByUsername,
  createLocalUser,
  upsertUser,
  updateUser,
  deleteUser,
  getAllPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  createQuote,
  getQuotesByUser,
  getAllQuotes,
  getQuoteById,
  updateQuote,
  deleteQuote,
  getQuoteItems,
  replaceQuoteItems,
  recalcQuoteTotal,
} from "./db";
import { hashPassword, verifyPassword } from "./localAuthManager";
import { searchProducts, testFirebirdConnection } from "./firebird";

// ─── Admin middleware ─────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao administrador." });
  }
  return next({ ctx });
});

// ─── Router de Usuários (admin) ───────────────────────────────────────────────
const usersRouter = router({
  list: adminProcedure.query(async () => {
    return getAllUsers();
  }),

  getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return getUserById(input.id);
  }),

  /**
   * Cria um usuário local com autenticação por username/senha
   */
  createLocal: adminProcedure
    .input(
      z.object({
        username: z.string().min(3, "Username deve ter pelo menos 3 caracteres"),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
        name: z.string().min(1, "Nome é obrigatório"),
        role: z.enum(["user", "admin"]).default("user"),
        canViewOtherQuotes: z.enum(["yes", "no"]).default("no"),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await getUserByUsername(input.username);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Este username já está em uso." });
      }
      const passwordHash = hashPassword(input.password);
      await createLocalUser({
        username: input.username,
        passwordHash,
        name: input.name,
        role: input.role,
        canViewOtherQuotes: input.canViewOtherQuotes,
      });
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["user", "admin"]).optional(),
        password: z.string().min(6).optional(),
        canViewOtherQuotes: z.enum(["yes", "no"]).optional(),
        active: z.enum(["yes", "no"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, password, ...data } = input;
      const updateData: any = { ...data };
      if (password) {
        updateData.passwordHash = hashPassword(password);
      }
      await updateUser(id, updateData);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (input.id === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode excluir sua própria conta." });
      }
      await deleteUser(input.id);
      return { success: true };
    }),
});

// ─── Router de Formas de Pagamento ────────────────────────────────────────────
const paymentMethodsRouter = router({
  list: protectedProcedure
    .input(z.object({ activeOnly: z.boolean().optional() }))
    .query(async ({ input }) => {
      return getAllPaymentMethods(input.activeOnly ?? false);
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        active: z.enum(["yes", "no"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      await createPaymentMethod({ name: input.name, description: input.description, active: input.active ?? "yes" });
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        active: z.enum(["yes", "no"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updatePaymentMethod(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deletePaymentMethod(input.id);
      return { success: true };
    }),
});

// ─── Router de Produtos (Firebird) ────────────────────────────────────────────
const productsRouter = router({
  search: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return searchProducts(input);
    }),

  testConnection: adminProcedure.query(async () => {
    return testFirebirdConnection();
  }),
});

// ─── Router de Orçamentos ─────────────────────────────────────────────────────
const quotesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role === "admin") {
      return getAllQuotes();
    }
    return getQuotesByUser(ctx.user.id);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const quote = await getQuoteById(input.id);
      if (!quote) throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado." });
      
      // Usuário normal só vê seus próprios orçamentos
      // Admin vê todos, mas pode ter restrição se canViewOtherQuotes = "no"
      if (ctx.user.role !== "admin" && quote.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado a este orçamento." });
      }
      
      if (ctx.user.role === "admin" && ctx.user.canViewOtherQuotes === "no" && quote.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem permissão para ver orçamentos de outros usuários." });
      }
      
      const items = await getQuoteItems(input.id);
      return { ...quote, items };
    }),

  create: protectedProcedure
    .input(
      z.object({
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        paymentMethodId: z.number().optional(),
        observations: z.string().optional(),
        items: z.array(
          z.object({
            productCode: z.string(),
            productName: z.string(),
            productBrand: z.string().optional(),
            quantity: z.number().positive(),
            unitPrice: z.number().min(0),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { items, ...quoteData } = input;
      const { id, number } = await createQuote({
        ...quoteData,
        userId: ctx.user.id,
        status: "draft",
      });

      const quoteItems = items.map((item) => ({
        quoteId: id,
        productCode: item.productCode,
        productName: item.productName,
        productBrand: item.productBrand || "",
        quantity: item.quantity.toFixed(2),
        unitPrice: item.unitPrice.toFixed(2),
        totalPrice: (item.quantity * item.unitPrice).toFixed(2),
      }));

      if (quoteItems.length > 0) {
        await replaceQuoteItems(id, quoteItems);
      }
      await recalcQuoteTotal(id);
      return { id, number };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        paymentMethodId: z.number().nullable().optional(),
        observations: z.string().optional(),
        status: z.enum(["draft", "sent", "approved", "rejected"]).optional(),
        items: z
          .array(
            z.object({
              productCode: z.string(),
              productName: z.string(),
              productBrand: z.string().optional(),
              quantity: z.number().positive(),
              unitPrice: z.number().min(0),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const quote = await getQuoteById(input.id);
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && quote.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { id, items, ...updateData } = input;
      await updateQuote(id, updateData);

      if (items !== undefined) {
        const quoteItems = items.map((item) => ({
          quoteId: id,
          productCode: item.productCode,
          productName: item.productName,
          productBrand: item.productBrand || "",
          quantity: item.quantity.toFixed(2),
          unitPrice: item.unitPrice.toFixed(2),
          totalPrice: (item.quantity * item.unitPrice).toFixed(2),
        }));
        await replaceQuoteItems(id, quoteItems);
        await recalcQuoteTotal(id);
      }

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const quote = await getQuoteById(input.id);
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role !== "admin" && quote.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await deleteQuote(input.id);
      return { success: true };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  users: usersRouter,
  paymentMethods: paymentMethodsRouter,
  products: productsRouter,
  quotes: quotesRouter,
});

export type AppRouter = typeof appRouter;
