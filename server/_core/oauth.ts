import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { verifyPassword } from "../localAuthManager";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Rota POST de login local com username/senha
  app.post("/api/local-login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ error: "Username e senha são obrigatórios" });
        return;
      }

      // Busca usuário por username
      const user = await db.getUserByUsername(username);
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "Username ou senha incorretos" });
        return;
      }

      // Verifica se o usuário está ativo
      if (user.active === "no") {
        res.status(403).json({ error: "Usuário desativado" });
        return;
      }

      // Verifica a senha
      if (!verifyPassword(password, user.passwordHash)) {
        res.status(401).json({ error: "Username ou senha incorretos" });
        return;
      }

      // Cria sessão local
      const sessionToken = await sdk.createSessionToken(user.openId || `local-user-${user.id}`, {
        name: user.name || username,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Atualiza último login (feito implicitamente no banco)

      res.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
    } catch (error) {
      console.error("[Local Auth] Login failed", error);
      res.status(500).json({ error: "Login falhou" });
    }
  });



  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
