import * as discord from "discord.js";
import { PictureManager } from "./Pictures";

export class Commands {
  client: discord.Client;
  manager: PictureManager;

  constructor(client: discord.Client, manager: PictureManager) {
    this.client = client;
    this.manager = manager;
  }

  private async cmdPictureAdd(msg: discord.Message, args: string[]) {
    if (args.length < 3) {
      msg.reply("I need one more parameter, the name of the album.");
      return;
    }
    if (!msg.attachments.size) {
      msg.reply("I need one attachment, the picture to add to the album.");
      return;
    }
    let proms: Promise<void>[] = [];
    for (let attachmentTuple of msg.attachments) {
      let att = attachmentTuple[1];
      proms.push(
        this.manager.add({
          album_name: args[2],
          guild_id: msg.guild.id,
          link: att.url,
          author_tag: msg.author.tag,
        })
      );
    }
    await Promise.all(proms);
    return msg.channel.send("I've saved the picture·s you sent me!");
  }

  private async cmdPictureDraw(msg: discord.Message, args: string[]) {
    let res = await this.manager.draw(msg.guild.id, args[1]);
    return await msg.channel.send("", { files: [new discord.MessageAttachment(res.link)] });
  }

  async process(msg: discord.Message) {
    if (msg.author.bot) return;
    if (!msg.mentions.has(this.client.user)) return;

    console.log("I was mentionned! :>");

    let args = msg.content.split(" ");

    console.log(args);

    try {
      if (args[1] === "add") {
        await this.cmdPictureAdd(msg, args);
      } else {
        await this.cmdPictureDraw(msg, args);
      }
    } catch (err) {
      console.warn(err);
    }
  }

  private async interPictureDraw(interaction: discord.CommandInteraction) {
    let res = await this.manager.draw(interaction.guildID, `${interaction.options[0].value}`);
    if (res) {
      await interaction.editReply("", { files: [new discord.MessageAttachment(res.link)] });
    } else {
      await interaction.editReply(`No such album: "${interaction.options[0].value}". :(`);
    }
  }

  async processInteraction(interaction: discord.Interaction) {
    if (!interaction.isCommand()) return;

    interaction.defer();

    if (interaction.commandName === "pic") {
      await this.interPictureDraw(interaction);
    } else if (interaction.commandName === "add") {
      await this.manager.add({
        album_name: `${interaction.options[0].value}`,
        guild_id: interaction.guildID,
        author_tag: interaction.user.tag,
        link: `${interaction.options[1].value}`,
      });
      await interaction.editReply("I've saved the following image:", {
        files: [new discord.MessageAttachment(`${interaction.options[1].value}`)],
      });
    }
  }
}
