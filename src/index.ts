import { r, RDatum, RTable, RethinkDBErrorType } from "rethinkdb-ts";
import * as discord from "discord.js";
import { isRethinkDBError } from "./isRethinkDBError";

export const client = new discord.Client({
  intents: ["GUILDS", "GUILD_INTEGRATIONS", "GUILD_MESSAGES"],
});

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  const pic_draw: discord.ApplicationCommandData = {
    name: "pic",
    description: "Show a random picture in chat.",
    options: [
      {
        name: "album",
        type: "STRING",
        description: "The album in which the pictures will be drawn",
        required: true,
      },
    ],
  };
  const pic_add: discord.ApplicationCommandData = {
    name: "add",
    description: "Add a picture by URL.",
    options: [
      {
        name: "album",
        type: "STRING",
        description: "The name in witch the picture needs to be added.",
        required: true,
      },
      {
        name: "url",
        type: "STRING",
        description: "The picture to add.",
        required: true,
      },
    ],
  };
  // (await client.fetchApplication()).commands.create(commandData);
  console.log(await client.application?.commands.create(pic_add));
  console.log(await client.application?.commands.create(pic_draw));
});

import config from "./config";

client.login(config.discord.token);

import { PictureManager } from "./Pictures";

r.connect({ server: { host: config.db.host, port: config.db.port } })
  .catch(() => {
    console.log("couldn't connect but that's expected");
  })
  .then(async (conn) => {
    console.log("it worked");

    if (conn) {
      let manager = new PictureManager(conn);
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
      await manager.ready;
      await manager.seed();

      client.on("interaction", async (interaction) => {
        // If the interaction isn't a slash command, return
        if (!interaction.isCommand()) return;

        interaction.defer();

        // Check if it is the correct command
        if (interaction.commandName === "echo") {
          // Get the input of the user
          const input = interaction.options[0].value;
          // Reply to the command
          await interaction.reply(`${input}`);
        } else if (interaction.commandName === "pic") {
          let res = await manager.draw(interaction.guildID, `${interaction.options[0].value}`);
          if (res)
            await interaction.editReply("", { files: [new discord.MessageAttachment(res.link)] });
          else interaction.editReply(`No such album: "${interaction.options[0].value}". :(`);
          // await interaction.reply("", {
          //   files: [new discord.MessageAttachment(res.link)],
          // });
        } else if (interaction.commandName === "add") {
          await manager.add({
            album_name: `${interaction.options[0].value}`,
            guild_id: interaction.guildID,
            author_tag: interaction.user.tag,
            link: `${interaction.options[1].value}`,
          });
          await interaction.editReply("I've saved the following image:", {
            files: [new discord.MessageAttachment(`${interaction.options[1].value}`)],
          });
        }
      });

      // conn.close().then(() => {
      //   console.log("closed");
      // });
    }
  });
