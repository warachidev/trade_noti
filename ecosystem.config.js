module.exports = {
  apps: [
    {
      name: 'notitrade-backend',
      script: 'dist/index.js',
      cwd: 'backend',
      instances: 1,
      autorestart: true,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
      },
      error_file: '../logs/backend-error.log',
      out_file: '../logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
    {
      name: 'notitrade-frontend',
      script: 'node',
      args: 'node_modules/vite/bin/vite.js preview --host 0.0.0.0 --port 5173',
      cwd: 'frontend',
      instances: 1,
      autorestart: true,
      max_memory_restart: '128M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '../logs/frontend-error.log',
      out_file: '../logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
