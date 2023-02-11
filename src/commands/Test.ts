import { Discord, Slash, SlashOption } from "discordx";
import { ApplicationCommandOptionType, CommandInteraction, InviteGuild } from "discord.js";
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
    @SlashOption({
      name: "permanent-server-invite",
      description: "A permanent invite to the server you own.",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    serverInvite: string,
    interaction: CommandInteraction
  ) {
    if (!interaction.inGuild()) {
      throw new Error("Command must be used within a guild!");
    }

    const invite = (await interaction.client.fetchInvite(serverInvite));
    const inviteGuild = invite.guild as InviteGuild;
    console.log(invite);

    await InteractionUtils.replyOrFollowUp(interaction, {
      content: `invite1: ${inviteGuild.name}, ${inviteGuild.nameAcronym}, ${inviteGuild.description}, ${inviteGuild.createdTimestamp}, ${inviteGuild.welcomeScreen}, ${invite.guild}`,
    });
  }
}
