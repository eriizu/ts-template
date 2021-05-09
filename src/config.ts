export default {
  db: {
    name: "piou_bot",
    table_name: "pictures",
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseInt(process.env.DB_PORT) || 49154,
  },
  discord: {
    token: process.env.DISCORD_TOKEN,
  },
};
