import { Discord, Slash } from "discordx";
import { CommandInteraction } from "discord.js";
import { injectable } from "tsyringe";
import { InteractionUtils } from "../utils/Utils.js";

@Discord()
@injectable()
export class Test {
  constructor(
  ) { }

  @Slash({
    name: "test",
    description: "test stuff",
  })
  async credits(
    interaction: CommandInteraction
  ) {
    if (!interaction.inGuild()) {
      throw new Error("Command must be used within a guild!");
    }

    await InteractionUtils.replyOrFollowUp(interaction, {
      content: "This is a test",
      ephemeral: true,
    });
  }
}
