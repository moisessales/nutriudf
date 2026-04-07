module.exports = {
  apps: [{
    name: 'nutriudf-api',
    script: './server.js',
    cwd: __dirname,
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_memory_restart: '300M',
    restart_delay: 3000,
    max_restarts: 10,
    autorestart: true
  }]
};
