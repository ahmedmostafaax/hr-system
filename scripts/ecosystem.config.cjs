/** PM2 process list — run from repo root: pm2 start ecosystem.config.cjs */
module.exports = {
  apps: [
    {
      name: "erb-api",
      cwd: "./erb",
      script: "dist/server.js",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
    {
      name: "erb-web",
      cwd: "./newerp",
      script: "npm",
      args: "start -- -p 3000",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
