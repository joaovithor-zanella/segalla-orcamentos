# Segalla - Guia de Deploy em Produção

## Visão Geral

Este guia descreve como fazer deploy do sistema Segalla em um servidor Ubuntu 22.04+ em produção, com Nginx, SSL, PM2 e backup automático.

---

## Opção 1: Deploy com Docker (Recomendado)

### Pré-requisitos

- Docker e Docker Compose instalados
- Domínio configurado (opcional)
- Certificado SSL (Let's Encrypt)

### Passo 1: Preparar o Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo bash get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### Passo 2: Clonar e Configurar

```bash
# Clonar repositório
git clone seu_repositorio /home/ubuntu/segalla-orcamentos
cd /home/ubuntu/segalla-orcamentos

# Copiar arquivo de ambiente
cp docker/.env.example .env

# Editar com suas configurações
nano .env
```

### Passo 3: Gerar Certificado SSL

```bash
# Criar diretório para SSL
mkdir -p docker/ssl

# Gerar certificado auto-assinado (desenvolvimento)
openssl req -x509 -newkey rsa:4096 -keyout docker/ssl/key.pem -out docker/ssl/cert.pem -days 365 -nodes

# OU usar Let's Encrypt (produção)
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d seu_dominio.com.br
sudo cp /etc/letsencrypt/live/seu_dominio.com.br/fullchain.pem docker/ssl/cert.pem
sudo cp /etc/letsencrypt/live/seu_dominio.com.br/privkey.pem docker/ssl/key.pem
sudo chown $USER:$USER docker/ssl/*
```

### Passo 4: Iniciar Containers

```bash
# Build e inicie
docker-compose -f docker/docker-compose.yml up -d

# Verifique status
docker-compose -f docker/docker-compose.yml ps

# Veja logs
docker-compose -f docker/docker-compose.yml logs -f app
```

### Passo 5: Acessar a Aplicação

```
https://seu_dominio.com.br
```

### Operações Comuns

```bash
# Ver logs
docker-compose -f docker/docker-compose.yml logs -f app

# Parar containers
docker-compose -f docker/docker-compose.yml down

# Fazer backup do banco
docker-compose -f docker/docker-compose.yml exec mysql mysqldump -u segalla_user -p segalla_orcamentos > backup.sql

# Restaurar backup
docker-compose -f docker/docker-compose.yml exec -T mysql mysql -u segalla_user -p segalla_orcamentos < backup.sql

# Executar comando no container
docker-compose -f docker/docker-compose.yml exec app bash
```

---

## Opção 2: Deploy Manual com PM2 + Nginx

### Pré-requisitos

- Node.js 18+
- MySQL 8.0+
- Nginx
- PM2

### Passo 1: Preparar o Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y curl wget git build-essential nginx mysql-server

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar pnpm
sudo npm install -g pnpm

# Instalar PM2
sudo npm install -g pm2

# Habilitar PM2 no boot
pm2 startup
pm2 save
```

### Passo 2: Clonar e Instalar

```bash
# Clonar repositório
cd /home/ubuntu
git clone seu_repositorio segalla-orcamentos
cd segalla-orcamentos

# Executar instalação automática
sudo bash scripts/install.sh

# Editar variáveis de ambiente
nano .env
```

### Passo 3: Compilar e Iniciar

```bash
# Compilar
pnpm build

# Iniciar com PM2
pm2 start ecosystem.config.js --env production

# Salvar configuração
pm2 save
```

### Passo 4: Configurar Nginx

```bash
# Copiar configuração
sudo cp nginx/segalla.conf /etc/nginx/sites-available/segalla

# Editar domínio
sudo nano /etc/nginx/sites-available/segalla
# Substitua "seu_dominio.com.br" pelo seu domínio real

# Ativar site
sudo ln -s /etc/nginx/sites-available/segalla /etc/nginx/sites-enabled/

# Desativar default
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### Passo 5: Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Gerar certificado
sudo certbot --nginx -d seu_dominio.com.br

# Renovação automática
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Passo 6: Configurar Backup Automático

```bash
# Editar crontab
crontab -e

# Adicionar linha para backup diário às 2AM
0 2 * * * cd /home/ubuntu/segalla-orcamentos && bash scripts/backup.sh
```

### Operações Comuns

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs segalla-app

# Reiniciar aplicação
pm2 restart segalla-app

# Parar aplicação
pm2 stop segalla-app

# Fazer backup manual
bash scripts/backup.sh

# Restaurar backup
bash scripts/restore.sh backups/backup_2024-01-15_10-30-00.sql.gz

# Atualizar sistema
bash scripts/update.sh
```

---

## Monitoramento e Manutenção

### PM2 Monitoring

```bash
# Ativar monitoramento
pm2 web

# Acessar dashboard
# http://localhost:9615
```

### Logs

```bash
# Ver logs em tempo real
pm2 logs segalla-app

# Ver logs com filtro
pm2 logs segalla-app | grep "ERROR"

# Limpar logs
pm2 flush
```

### Backup e Restauração

```bash
# Backup automático (configurado no crontab)
bash scripts/backup.sh

# Restaurar backup
bash scripts/restore.sh backups/backup_YYYY-MM-DD_HH-MM-SS.sql.gz

# Listar backups
ls -lh backups/
```

### Atualização do Sistema

```bash
# Atualizar para versão mais recente
bash scripts/update.sh

# O script faz:
# 1. Backup automático
# 2. Para o servidor
# 3. Atualiza código (git pull)
# 4. Instala dependências
# 5. Compila projeto
# 6. Executa testes
# 7. Reinicia servidor
```

---

## Troubleshooting

### Aplicação não inicia

```bash
# Ver logs detalhados
pm2 logs segalla-app --lines 100

# Verificar erros TypeScript
pnpm check

# Recompilar
pnpm build

# Reiniciar
pm2 restart segalla-app
```

### Banco de dados não conecta

```bash
# Verificar status MySQL
sudo systemctl status mysql

# Reiniciar MySQL
sudo systemctl restart mysql

# Testar conexão
mysql -u segalla_user -p segalla_orcamentos -e "SELECT 1;"
```

### Nginx não redireciona

```bash
# Testar configuração
sudo nginx -t

# Ver logs
sudo tail -f /var/log/nginx/segalla-error.log

# Recarregar
sudo systemctl reload nginx
```

### Firebird não conecta

```bash
# Verificar conectividade
telnet FIREBIRD_HOST 3050

# Verificar variáveis de ambiente
cat .env | grep FIREBIRD

# Testar conexão no código
# Adicione logs em server/firebird.ts
```

---

## Performance e Segurança

### Otimizações

1. **Gzip Compression**: Habilitado no Nginx
2. **Cache de Estáticos**: 1 dia para JS/CSS/Imagens
3. **Connection Pooling**: MySQL com pool de conexões
4. **Cluster Mode**: PM2 com múltiplas instâncias

### Segurança

1. **HTTPS/SSL**: Certificado Let's Encrypt
2. **Security Headers**: HSTS, X-Frame-Options, etc.
3. **Rate Limiting**: Nginx com limit_req
4. **Firewall**: Restrinja portas (22, 80, 443, 3306)
5. **Backups**: Diários com retenção de 7 dias

### Checklist de Segurança

- [ ] Certificado SSL válido
- [ ] Firewall configurado
- [ ] Backups funcionando
- [ ] Senhas fortes (MySQL, Firebird)
- [ ] SSH com chave pública
- [ ] Logs monitorados
- [ ] Atualizações do SO aplicadas

---

## Suporte e Documentação

- **Documentação**: `docs/`
- **Configuração**: `docs/CONFIGURACAO.md`
- **Banco de Dados**: `docs/BANCO_DE_DADOS.md`
- **Issues**: Verifique logs em `logs/`
- **Backup**: Verifique em `backups/`

---

## Próximos Passos

1. Teste a aplicação em staging
2. Configure monitoramento (PM2 Web, Datadog, etc.)
3. Configure alertas para falhas
4. Documente seu setup específico
5. Treine sua equipe

---

**Última atualização**: 2024-01-15
**Versão**: 1.0.0
