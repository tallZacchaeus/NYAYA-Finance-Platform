/** @type {import('pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: 'nyaya-web',
      script: '.next/standalone/server.js',
      cwd: '/var/www/nyaya-web',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
