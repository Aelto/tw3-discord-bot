import { Channel, Message, MessageActionRow, MessageButton } from "discord.js";

const path = require("path");

export class ListenerAnswers {
  private answers: string[];
  constructor(answers: string[]) {
    this.answers = answers;
  }

  public canSend() {
    return this.answers.length > 0;
  }

  public async sendReplies(message: Message) {
    for (const answer of this.answers) {
      await this.sendOneReply(message, answer);
    }
  }

  private async sendOneReply(message: Message, reply: string) {
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("delete_listen")
        .setLabel("Delete")
        .setStyle("SECONDARY")
    );

    if (reply.startsWith("file=")) {
      const file_alias = reply.replace("file=", "");
      const path = this.getFilePathFromAlias(file_alias);

      await message.channel
        .send({ files: [path], components: [row] })
        .catch(console.error);
    } else {
      await message
        .reply({
          content: reply,
          components: [row],
        })
        .catch(console.error);
    }
  }

  private getFilePathFromAlias(alias: string) {
    const assets_folder = path.join(__dirname, "..", "..", "assets");

    switch (alias) {
      case "shock01":
        return path.join(assets_folder, "wild_hunt_shock_01.wav");
        break;

      case "shock02":
        return path.join(assets_folder, "wild_hunt_shock_01.wav");
        break;

      case "parry02":
        return path.join(assets_folder, "geralt_w3_parry_02.wav");
        break;
    }
  }
}
