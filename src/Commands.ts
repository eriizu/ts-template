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
      msg.reply("J'ai besoin d'un paramètre supplémentaire, le nom de l'album.");
      return;
    }
    if (!msg.attachments.size) {
      msg.reply("J'ai besoin d'au moins une pièce jointe.");
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
    return msg.channel.send("Je sauvergardé la ou les images que vous m'avez envoyé !");
  }

  private async cmdPictureDraw(msg: discord.Message, args: string[]) {
    let res = await this.manager.draw(msg.guild.id, args[1]);
    return await msg.channel.send("", { files: [new discord.MessageAttachment(res.link)] });
  }

  private async cmdDeleteLast(guild_id: string) {
    this.manager.deleteLast(guild_id);
  }

  async process(msg: discord.Message) {
    if (msg.author.bot) return;
    if (!msg.mentions.has(this.client.user)) return;

    console.log("I was mentionned! :>");
    msg.channel.startTyping();

    let args = msg.content.split(" ");

    console.log(args);

    try {
      if (args[1] === "add") {
        await this.cmdPictureAdd(msg, args);
      } else if (args[1] === "delete_last") {
        await this.cmdDeleteLast(msg.guild.id);
      } else {
        await this.cmdPictureDraw(msg, args);
      }
    } catch (err) {
      console.warn(err);
    }
    msg.channel.stopTyping();
  }

  private async interPictureDraw(interaction: discord.CommandInteraction) {
    let res = await this.manager.draw(interaction.guildID, `${interaction.options[0].value}`);
    if (res) {
      await interaction.editReply("", { files: [new discord.MessageAttachment(res.link)] });
    } else {
      await interaction.editReply(`L'album "${interaction.options[0].value}" n'existe po. :(`);
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
      await interaction.editReply(
        "J'ai sauvegardé l'image qui suit ! Si la source est supprimée, l'image ne marchera plus.",
        {
          files: [new discord.MessageAttachment(`${interaction.options[1].value}`)],
        }
      );
    } else if (interaction.commandName === "list") {
      let res = await this.manager.list(interaction.guildID);
      if (res.length) {
        await interaction.editReply("*Voici les albums de cette guilde* :\n\n" + res.join("\n"));
      } else {
        await interaction.editReply("Vous n'avez pas d'albums par ici. 😖");
      }
    }
  }
}
