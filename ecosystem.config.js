// ============================================================
// SEGALLA - SISTEMA DE ORÇAMENTOS
// PM2 Ecosystem Configuration
// ============================================================
// Uso: pm2 start ecosystem.config.js
// Mais: pm2 status | pm2 logs | pm2 restart all

module.exports = {
  apps: [
    {
      // ─── APLICAÇÃO PRINCIPAL ──────────────────────────────────────────
      name: 'segalla-app',
      script: './dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      
      // ─── AMBIENTE ──────────────────────────────────────────────────────
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // ─── REINICIALIZAÇÃO ──────────────────────────────────────────────
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      
      // ─── LOGS ─────────────────────────────────────────────────────────
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      out_file: './logs/app-out.log',
      error_file: './logs/app-error.log',
      combine_logs: true,
      
      // ─── GRACEFUL SHUTDOWN ────────────────────────────────────────────
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // ─── HEALTH CHECK ─────────────────────────────────────────────────
      max_restarts: 10,
      min_uptime: '10s',
      
      // ─── VARIÁVEIS DE AMBIENTE ────────────────────────────────────────
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // ─── MONITORAMENTO ────────────────────────────────────────────────
      monitoring_interval: 5000,
    },
    
    // ─── BACKUP AUTOMÁTICO (OPCIONAL) ─────────────────────────────────
    {
      name: 'segalla-backup',
      script: './scripts/backup.sh',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0 2 * * *', // 2AM todos os dias
      autorestart: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      out_file: './logs/backup-out.log',
      error_file: './logs/backup-error.log',
    },
  ],
  
  // ─── DEPLOY CONFIGURATION ─────────────────────────────────────────────
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'seu_servidor_ip',
      ref: 'origin/main',
      repo: 'seu_repositorio_git',
      path: '/home/ubuntu/segalla-orcamentos',
      'post-deploy': 'pnpm install && pnpm build && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': 'echo "Deploying to production"',
    },
  },
};
