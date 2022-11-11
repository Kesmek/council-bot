import { Discord, Slash } from "discordx";
import { CommandInteraction } from "discord.js";
import { BotCreator } from "../utils/Constants.js";

@Discord()
class Credits {
  @Slash({
    name: "credits",
    description: "Information about the creator of this bot",
    dmPermission: true,
  })
  async credits(interaction: CommandInteraction) {
    await interaction.reply({
      content: `This bot was created by ${BotCreator}. If you have any questions or suggestions,` +
        ` please message them and voice your comments.`,
      ephemeral: true,
    });
  }
}
