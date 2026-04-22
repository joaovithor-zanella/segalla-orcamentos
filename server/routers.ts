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

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["user", "admin"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateUser(id, data);
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

  /**
   * Cria um usuário manualmente pelo administrador.
   * O usuário criado não terá senha própria — o acesso é feito via OAuth Manus.
   * O openId deve ser o identificador Manus do usuário a ser adicionado.
   */
  create: adminProcedure
    .input(
      z.object({
        openId: z.string().min(1, "openId é obrigatório"),
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("E-mail inválido").optional(),
        role: z.enum(["user", "admin"]).default("user"),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await getUserByOpenId(input.openId);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Já existe um usuário com este openId." });
      }
      await upsertUser({
        openId: input.openId,
        name: input.name,
        email: input.email ?? null,
        role: input.role,
        lastSignedIn: new Date(),
      });
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
      if (ctx.user.role !== "admin" && quote.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
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
            productReference: z.string().optional(),
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
        productReference: item.productReference || "",
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
              productReference: z.string().optional(),
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
          productReference: item.productReference || "",
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
