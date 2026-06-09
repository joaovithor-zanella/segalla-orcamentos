# ============================================================
# SEGALLA - SISTEMA DE ORÇAMENTOS
# Dockerfile para containerização
# ============================================================
# Build: docker build -t segalla:latest -f docker/Dockerfile .
# Run: docker run -p 3000:3000 --env-file .env segalla:latest

# ─── STAGE 1: BUILD ───────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev

# Copiar package files
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código-fonte
COPY . .

# Compilar TypeScript
RUN pnpm build

# ─── STAGE 2: RUNTIME ─────────────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

# Instalar dumb-init para melhor gerenciamento de processos
RUN apk add --no-cache dumb-init

# Instalar dependências de runtime
RUN apk add --no-cache cairo jpeg pango giflib

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar dependências do builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Copiar arquivos estáticos
COPY --from=builder /app/client/dist ./client/dist

# Copiar scripts e documentação
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/database ./database
COPY --from=builder /app/docs ./docs

# Criar diretórios de logs e backups
RUN mkdir -p logs backups && \
    chown -R nodejs:nodejs /app

# Trocar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Usar dumb-init para iniciar o processo
ENTRYPOINT ["/sbin/dumb-init", "--"]

# Comando padrão
CMD ["node", "dist/index.js"]
