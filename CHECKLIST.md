# Segalla - Checklist de Portabilidade e Validação

## ✅ Pré-Deploy

### Ambiente Local (Desenvolvimento)

- [ ] Node.js 18+ instalado
- [ ] pnpm instalado globalmente
- [ ] MySQL 8.0+ rodando localmente
- [ ] Firebird 2.5 acessível
- [ ] `.env` configurado com credenciais
- [ ] `pnpm install` executado sem erros
- [ ] `pnpm check` sem erros TypeScript
- [ ] `pnpm test` todos os testes passando
- [ ] `pnpm build` compilação bem-sucedida
- [ ] `pnpm dev` servidor iniciando sem erros
- [ ] Login funcionando (admin/Segalla@2025)
- [ ] Catálogo de produtos carregando
- [ ] Criar orçamento funciona
- [ ] Exportar PDF/Excel/Word funciona
- [ ] Criar usuário funciona

### Firebird Integration

- [ ] `FIREBIRD_HOST` correto
- [ ] `FIREBIRD_PORT` acessível (3050)
- [ ] `FIREBIRD_DATABASE` caminho correto
- [ ] `FIREBIRD_USER` e `FIREBIRD_PASSWORD` válidos
- [ ] Conexão testada com sucesso
- [ ] Produtos carregando do Firebird
- [ ] Estoque em tempo real funcionando
- [ ] Preços corretos
- [ ] Marcas carregando

### Database

- [ ] MySQL iniciado
- [ ] Banco `segalla_orcamentos` criado
- [ ] Tabelas criadas com sucesso
- [ ] Seeds importados
- [ ] Usuário admin criado
- [ ] Permissões corretas

---

## 🚀 Deploy com Docker

### Pré-Requisitos

- [ ] Docker instalado (versão 20+)
- [ ] Docker Compose instalado (versão 1.29+)
- [ ] Domínio configurado (opcional)
- [ ] Certificado SSL preparado (opcional)

### Configuração

- [ ] `docker/.env.example` copiado para `.env`
- [ ] Todas as variáveis `FIREBIRD_*` configuradas
- [ ] `MYSQL_ROOT_PASSWORD` alterado
- [ ] `MYSQL_PASSWORD` alterado
- [ ] `JWT_SECRET` gerado (32+ caracteres)
- [ ] Certificado SSL em `docker/ssl/` (se usar HTTPS)

### Build e Deploy

- [ ] `docker-compose build` sem erros
- [ ] `docker-compose up -d` containers iniciando
- [ ] `docker-compose ps` mostrando 3 containers (mysql, app, nginx)
- [ ] Logs sem erros: `docker-compose logs app`
- [ ] MySQL health check passando
- [ ] App health check passando
- [ ] Nginx respondendo em porta 80/443
- [ ] Aplicação acessível em `http://localhost`
- [ ] Login funcionando
- [ ] Firebird conectando

### Persistência

- [ ] Volume MySQL criado: `docker volume ls`
- [ ] Dados persistindo após restart
- [ ] Backup automático configurado

---

## 🚀 Deploy Manual (PM2 + Nginx)

### Pré-Requisitos

- [ ] Ubuntu 22.04+ LTS
- [ ] Node.js 18+ instalado
- [ ] MySQL 8.0+ instalado
- [ ] Nginx instalado
- [ ] PM2 instalado globalmente
- [ ] Git instalado

### Instalação

- [ ] `sudo bash scripts/install.sh` executado com sucesso
- [ ] Todas as dependências instaladas
- [ ] Banco de dados criado
- [ ] `.env` configurado
- [ ] Firebird testado

### Build e Deploy

- [ ] `pnpm build` compilação bem-sucedida
- [ ] `pm2 start ecosystem.config.js` iniciado
- [ ] `pm2 status` mostrando app rodando
- [ ] `pm2 logs segalla-app` sem erros
- [ ] Nginx configurado: `/etc/nginx/sites-available/segalla`
- [ ] Nginx testado: `sudo nginx -t`
- [ ] Nginx recarregado: `sudo systemctl reload nginx`
- [ ] Aplicação acessível em `http://localhost:3000`
- [ ] Nginx proxy funcionando em porta 80

### SSL/HTTPS

- [ ] Certbot instalado
- [ ] Certificado Let's Encrypt gerado
- [ ] HTTPS funcionando
- [ ] HTTP redirecionando para HTTPS
- [ ] Certificado auto-renovando

### Monitoramento

- [ ] PM2 startup configurado: `pm2 startup`
- [ ] PM2 salvo: `pm2 save`
- [ ] PM2 web ativo: `pm2 web`
- [ ] Dashboard PM2 acessível em `http://localhost:9615`

---

## 🔒 Segurança

### Credenciais

- [ ] Senhas alteradas (não usar defaults)
- [ ] JWT_SECRET gerado com 32+ caracteres
- [ ] Firebird password alterada
- [ ] MySQL root password alterada
- [ ] SSH key-based authentication configurada

### Firewall

- [ ] Porta 22 (SSH) restrita
- [ ] Porta 80 (HTTP) aberta
- [ ] Porta 443 (HTTPS) aberta
- [ ] Porta 3306 (MySQL) restrita (localhost)
- [ ] Porta 3050 (Firebird) restrita (VPN)
- [ ] Outras portas fechadas

### Backups

- [ ] Script backup testado: `bash scripts/backup.sh`
- [ ] Crontab configurado para backup diário
- [ ] Backup restaurado com sucesso: `bash scripts/restore.sh`
- [ ] Retenção de 7 backups configurada

### Logs

- [ ] Logs sendo gerados em `logs/`
- [ ] Rotação de logs configurada
- [ ] Acesso a logs restrito

---

## 📊 Funcionalidades

### Autenticação

- [ ] Login com username/senha funciona
- [ ] Logout funciona
- [ ] Sessão persiste entre páginas
- [ ] Logout limpa sessão

### Usuários

- [ ] Admin consegue criar usuário
- [ ] Usuário criado consegue fazer login
- [ ] Admin consegue editar usuário
- [ ] Admin consegue deletar usuário
- [ ] Papéis (admin/user) funcionam
- [ ] Permissão "Ver Outros Orçamentos" funciona

### Catálogo

- [ ] Produtos carregam do Firebird
- [ ] Busca por código funciona
- [ ] Busca por nome funciona
- [ ] Busca por marca funciona
- [ ] Filtros funcionam
- [ ] Paginação funciona
- [ ] Estoque em tempo real correto
- [ ] Preços corretos

### Orçamentos

- [ ] Criar novo orçamento funciona
- [ ] Adicionar produtos funciona
- [ ] Remover produtos funciona
- [ ] Editar quantidade funciona
- [ ] Calcular total funciona
- [ ] Salvar orçamento funciona
- [ ] Editar orçamento funciona
- [ ] Listar orçamentos funciona
- [ ] Usuário vê apenas seus orçamentos
- [ ] Admin vê todos os orçamentos

### Formas de Pagamento

- [ ] Admin consegue criar forma de pagamento
- [ ] Forma de pagamento aparece ao criar orçamento
- [ ] Admin consegue editar forma de pagamento
- [ ] Admin consegue deletar forma de pagamento

### Exportação

- [ ] Exportar PDF funciona
- [ ] Exportar Excel funciona
- [ ] Exportar Word funciona
- [ ] Documento contém identidade Segalla
- [ ] Documento contém dados corretos
- [ ] Usuário consegue exportar seu orçamento
- [ ] Admin consegue exportar qualquer orçamento
- [ ] Usuário não consegue exportar orçamento de outro

---

## 🎯 Performance

### Velocidade

- [ ] Página inicial carrega em < 2s
- [ ] Catálogo carrega em < 3s
- [ ] Busca retorna em < 1s
- [ ] Exportação PDF em < 5s
- [ ] Exportação Excel em < 5s
- [ ] Exportação Word em < 5s

### Escalabilidade

- [ ] 100+ produtos carregam sem lag
- [ ] 1000+ orçamentos no banco sem lentidão
- [ ] Múltiplos usuários simultâneos funcionam
- [ ] Conexão Firebird estável

### Recursos

- [ ] CPU < 50% em repouso
- [ ] Memória < 200MB em repouso
- [ ] Conexões MySQL < 10 em repouso

---

## 📱 Responsividade

- [ ] Desktop (1920x1080) funciona
- [ ] Tablet (768x1024) funciona
- [ ] Mobile (375x667) funciona
- [ ] Sidebar responsiva
- [ ] Tabelas responsivas
- [ ] Forms responsivos
- [ ] Modais responsivos

---

## 🧪 Testes

- [ ] `pnpm test` todos passando
- [ ] Cobertura de testes > 80%
- [ ] Testes de autenticação passando
- [ ] Testes de orçamentos passando
- [ ] Testes de exportação passando

---

## 📚 Documentação

- [ ] README.md completo
- [ ] INSTALACAO.md atualizado
- [ ] CONFIGURACAO.md com todas as variáveis
- [ ] BANCO_DE_DADOS.md com schema
- [ ] DEPLOY_PRODUCAO.md com instruções
- [ ] Código comentado adequadamente
- [ ] Erros com mensagens claras

---

## 🚨 Tratamento de Erros

- [ ] Erro de conexão Firebird exibe mensagem clara
- [ ] Erro de conexão MySQL exibe mensagem clara
- [ ] Erro de autenticação exibe mensagem clara
- [ ] Erro de permissão exibe mensagem clara
- [ ] Erro de validação exibe mensagem clara
- [ ] Logs contêm stack trace completo

---

## 🔄 Atualização

- [ ] `bash scripts/update.sh` funciona
- [ ] Backup automático antes de atualizar
- [ ] Código atualizado com sucesso
- [ ] Dependências atualizadas
- [ ] Testes passam após atualização
- [ ] Servidor reinicia sem erros

---

## 🎓 Treinamento

- [ ] Equipe treinada em criar usuários
- [ ] Equipe treinada em criar orçamentos
- [ ] Equipe treinada em exportar orçamentos
- [ ] Equipe treinada em fazer backup
- [ ] Equipe treinada em restaurar backup
- [ ] Equipe conhece contato de suporte

---

## ✨ Pós-Deploy

### Monitoramento

- [ ] Alertas configurados para falhas
- [ ] Logs sendo monitorados
- [ ] Performance sendo monitorada
- [ ] Uptime sendo rastreado

### Manutenção

- [ ] Backup automático rodando
- [ ] Atualizações de segurança aplicadas
- [ ] Certificado SSL renovando automaticamente
- [ ] Logs sendo rotacionados

### Documentação

- [ ] Runbook de operações criado
- [ ] Contatos de emergência documentados
- [ ] Procedimentos de disaster recovery documentados
- [ ] Acesso e credenciais documentadas (seguro)

---

## 📋 Sign-Off

| Item | Responsável | Data | Assinatura |
|------|-------------|------|-----------|
| Desenvolvimento | Manus AI | 2024-01-15 | ✅ |
| QA/Testes | _____________ | ________ | ____ |
| Deploy | _____________ | ________ | ____ |
| Treinamento | _____________ | ________ | ____ |
| Aprovação Final | _____________ | ________ | ____ |

---

**Versão**: 1.0.0
**Última Atualização**: 2024-01-15
**Status**: ✅ Production Ready
