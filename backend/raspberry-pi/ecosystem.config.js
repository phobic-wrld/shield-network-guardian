module.exports = {
  apps: [{
    name: 'shield-network-pi',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '200M',
    restart_delay: 4000,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      SCAN_INTERVAL: 300000,
      PING_INTERVAL: 5000,
      LOG_LEVEL: 'info'
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3001,
      LOG_LEVEL: 'debug'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    kill_timeout: 5000
  }]
};