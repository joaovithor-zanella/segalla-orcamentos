# Correções de Autenticação para Deployment em Servidor Ubuntu

## Problema Identificado

Após exportar e implantar o sistema em um servidor Ubuntu (`http://192.168.1.88:3000`), o login retornava sucesso, mas o frontend continuava exibindo a tela de login mesmo com a sessão sendo criada.

### Causa Raiz

O arquivo `server/_core/cookies.ts` estava configurando cookies com:
```
SameSite=None; Secure=false
```

Em ambientes HTTP (não-HTTPS), navegadores modernos **rejeitam silenciosamente** cookies com `SameSite=None` quando `Secure=false`. Isso causava:

1. ✅ `/api/local-login` retorna sucesso
2. ✅ Servidor envia `Set-Cookie` com a sessão
3. ❌ Navegador descarta o cookie
4. ❌ Requisições subsequentes não contêm o cookie
5. ❌ `trpc.auth.me` retorna `null` (não autenticado)
6. ❌ Frontend permanece na tela de login

## Correções Implementadas

### 1. Arquivo: `server/_core/cookies.ts`

**Antes:**
```typescript
return {
  httpOnly: true,
  path: "/",
  sameSite: "none",  // ❌ Problemático em HTTP
  secure: isSecureRequest(req),
};
```

**Depois:**
```typescript
const hostname = req.hostname || "";
const isSecure = isSecureRequest(req);
const isLocalhost = LOCAL_HOSTS.has(hostname) || isIpAddress(hostname);

// Em ambientes locais (localhost, 127.0.0.1, IPs privados), use SameSite=Lax
// Em ambientes HTTPS, use SameSite=None com Secure=true
// Em ambientes HTTP não-locais, use SameSite=Lax (fallback seguro)
const sameSite = isSecure ? "none" : isLocalhost ? "lax" : "lax";

return {
  httpOnly: true,
  path: "/",
  sameSite,
  secure: isSecure,
};
```

**Lógica:**
- **HTTPS**: `SameSite=None; Secure=true` (padrão seguro para produção)
- **HTTP em localhost/127.0.0.1/IP privado**: `SameSite=Lax; Secure=false` (aceito pelos navegadores)
- **HTTP em domínio público**: `SameSite=Lax; Secure=false` (fallback seguro)

### 2. Arquivo: `client/src/pages/Login.tsx`

**Antes:**
```typescript
const response = await fetch("/api/local-login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
  // ❌ Sem credentials: "include"
});
```

**Depois:**
```typescript
const response = await fetch("/api/local-login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
  credentials: "include", // ✅ Enviar cookies com a requisição
});

// Login bem-sucedido, aguardar um pouco para o cookie ser processado
await new Promise(resolve => setTimeout(resolve, 100));
setLocation("/");
```

## Fluxo de Autenticação Corrigido

```
1. Usuário preenche username/senha
2. Frontend: POST /api/local-login com credentials: "include"
3. Backend: Valida credenciais e cria session token (JWT)
4. Backend: Envia Set-Cookie com SameSite=Lax (em HTTP local)
5. Navegador: ✅ Aceita o cookie (SameSite=Lax é permitido em HTTP)
6. Frontend: Aguarda 100ms para o cookie ser processado
7. Frontend: Redireciona para /
8. ProtectedRouter: Chama useAuth() → trpc.auth.me
9. Frontend: Envia GET /api/trpc/auth.me com credentials: "include"
10. Backend: Valida JWT do cookie e retorna user
11. Frontend: ✅ Reconhece como autenticado
12. Dashboard: Exibido com sucesso
```

## Testes Implementados

Arquivo: `server/_core/cookies.test.ts`

Testes adicionados para validar:
- ✅ `SameSite=lax` em localhost com HTTP
- ✅ `SameSite=lax` em 127.0.0.1 com HTTP
- ✅ `SameSite=lax` em IP privado (192.168.1.x) com HTTP
- ✅ `SameSite=none` com `Secure=true` em HTTPS
- ✅ `SameSite=none` com `Secure=true` quando `x-forwarded-proto=https`
- ✅ `SameSite=lax` em domínio público com HTTP (fallback)

**Executar testes:**
```bash
pnpm test
```

## Como Testar no Seu Servidor Ubuntu

### 1. Atualizar o código

```bash
cd /caminho/para/segalla-orcamentos
git pull origin main  # ou copiar os arquivos atualizados
```

### 2. Reconstruir o projeto

```bash
pnpm install
pnpm build
```

### 3. Reiniciar o servidor

```bash
# Se estiver usando PM2
pm2 restart segalla-orcamentos

# Se estiver usando systemd
sudo systemctl restart segalla-orcamentos

# Se estiver rodando manualmente
npm start
```

### 4. Testar o login

1. Acesse `http://192.168.1.88:3000`
2. Preencha as credenciais:
   - Username: `admin`
   - Senha: `@Segalla2025`
3. Clique em "Entrar"
4. ✅ Você deve ser redirecionado para o dashboard

### 5. Verificar cookies no navegador

Abra as Developer Tools (F12):
1. Vá para **Application** → **Cookies**
2. Procure por `app_session_id`
3. Verifique os atributos:
   - ✅ `SameSite=Lax` (em HTTP local)
   - ✅ `HttpOnly=true`
   - ✅ `Path=/`
   - ✅ `Secure=false` (em HTTP)

### 6. Verificar requisições de rede

1. Abra as Developer Tools (F12)
2. Vá para **Network**
3. Faça login
4. Procure por `auth.me` (requisição tRPC)
5. Verifique que o cookie está sendo enviado no header `Cookie`

## Variáveis de Ambiente Recomendadas

Para ambientes de produção com HTTPS, adicione ao seu `.env`:

```bash
# Obrigatório para produção
OAUTH_SERVER_URL=https://api.manus.im

# Opcional (analytics)
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=seu-id-aqui

# Obrigatório (gerado automaticamente)
JWT_SECRET=seu-secret-aqui
DATABASE_URL=mysql://user:pass@host/database
```

## Comportamento em Diferentes Ambientes

| Ambiente | Protocolo | SameSite | Secure | Resultado |
|----------|-----------|----------|--------|-----------|
| localhost | HTTP | Lax | false | ✅ Funciona |
| 127.0.0.1 | HTTP | Lax | false | ✅ Funciona |
| 192.168.1.88 | HTTP | Lax | false | ✅ Funciona |
| example.com | HTTP | Lax | false | ✅ Funciona (fallback) |
| example.com | HTTPS | None | true | ✅ Funciona (produção) |

## Referências

- [MDN: SameSite Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [Chrome: Cookies and SameSite](https://web.dev/samesite-cookies-explained/)
- [Express: res.cookie()](https://expressjs.com/en/api/response.html#res.cookie)

## Suporte

Se o login ainda não funcionar após essas correções:

1. Verifique os logs do servidor:
   ```bash
   tail -f /var/log/segalla-orcamentos/app.log
   ```

2. Verifique o console do navegador (F12) para erros de rede

3. Verifique se o cookie está sendo enviado:
   ```bash
   curl -v -X POST http://192.168.1.88:3000/api/local-login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"@Segalla2025"}'
   ```

4. Procure por `Set-Cookie` na resposta
