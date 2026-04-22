// Valores padrão para desenvolvimento local
const isDev = process.env.NODE_ENV === "development";

export const ENV = {
  appId: process.env.VITE_APP_ID ?? (isDev ? "local-dev-app" : ""),
  cookieSecret: process.env.JWT_SECRET ?? (isDev ? "dev-secret-key-change-in-production" : ""),
  databaseUrl: process.env.DATABASE_URL ?? (isDev ? "mysql://root:password@localhost:3306/segalla_orcamentos" : ""),
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? (isDev ? "local-admin-user" : ""),
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
