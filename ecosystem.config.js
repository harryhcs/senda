module.exports = {
  apps: [
    {
      name: "SMTP Server",
      script: "./src/index.js",
      instances: "MAX",
      autorestart: false,
      watch: true,
      max_memory_restart: "1G",
      exec_mode: "cluster",
    },
  ]
};
