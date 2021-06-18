import { r, RDatum, RTable, RethinkDBErrorType } from "rethinkdb-ts";
import * as discord from "discord.js";

export const client = new discord.Client({
  intents: ["GUILDS", "GUILD_INTEGRATIONS", "GUILD_MESSAGES"],
});

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const pic_draw: discord.ApplicationCommandData = {
    name: "pic",
    description: "Affiche une image au pif depuis une de vos collections.",
    options: [
      {
        name: "album",
        type: "STRING",
        description: "La collection depuis laquelle choisir l'image.",
        required: true,
      },
    ],
  };
  const pic_add: discord.ApplicationCommandData = {
    name: "add",
    description: "Ajouter une image avec son URL.",
    options: [
      {
        name: "album",
        type: "STRING",
        description: "La collection où mettre l'image.",
        required: true,
      },
      {
        name: "url",
        type: "STRING",
        description: "L'URL de l'image en question.",
        required: true,
      },
    ],
  };
  const album_list: discord.ApplicationCommandData = {
    name: "list",
    description: "Affiche toutes les collections de la guilde.",
  };

  // (await client.fetchApplication()).commands.create(commandData);
  // console.log(await client.application?.commands.create(album_list));
  // console.log(await client.application?.commands.create(pic_add));
  // console.log(await client.application?.commands.create(pic_draw));
});

import config from "./config";

client.login(config.discord.token);
import { PictureManager } from "./Pictures";
import { Commands } from "./Commands";

r.connect({ server: { host: config.db.host, port: config.db.port } })
  .catch(() => {
    console.log("couldn't connect but that's expected");
  })
  .then(async (conn) => {
    console.log("it worked");

    if (conn) {
      let manager = new PictureManager(conn);
      let processor = new Commands(client, manager);

      await manager.ready;
      await manager.seed();

      client.on("interaction", async (interaction) => processor.processInteraction(interaction));
      client.on("message", async (msg) => processor.process(msg));

      // console.log(conn);
      // try {
      //   await r.db("test").tableCreate("users").run(conn);
      // } catch (err) {
      //   if (isRethinkDBError(err)) {
      //     if (err.type == RethinkDBErrorType.OP_FAILED) console.log("already exists");
      //   }
      // }
      // let table: RTable<user> = r.db("test").table("users");

      // await table.insert({ name: "Élise", gender: "no" }).run(conn);
      // await table.insert({ name: "Potate", gender: "probably" }).run(conn);
      // await table.insert({ name: "Douce" }).run(conn);

      // let users = await table
      //   // .table<RDatum<{ name: string; gender: string }>>("prout")
      //   .filter((doc) => doc("name").eq("Élise"))
      //   .run(conn);

      // console.log(users);

      // conn.close().then(() => {
      //   console.log("closed");
      // });
    }
  });
