const path = require("node:path");

const root = path.join(__dirname, "..");
const backend = path.join(root, "apps/backend");
const logs = path.join(root, "logs");

module.exports = {
  apps: [
    {
      name: "Lattice Api",
      cwd: backend,
      script: "dist/index.js",
      instances: 1,
      exec_mode: "fork",

      kill_timeout: 10_000,
      wait_ready: false,

      max_memory_restart: "512M",
      error_file: path.join(logs, "api-error.log"),
      out_file: path.join(logs, "api-out.log"),
      time: true,
    },
  ],
};
