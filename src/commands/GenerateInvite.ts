import { CommandInteraction, PermissionsBitField, TextChannel } from "discord.js";
import { Discord, Slash } from "discordx";
import { CommandActions, TimeUnit } from "../utils/Constants.js";
import { Logger } from "../utils/Logger.js";
import { injectable } from "tsyringe";

@Discord()
@injectable()
export class GenerateInvite {
  constructor(
    private _logger: Logger,
  ) { }

  @Slash({
    name: "generate-invite",
    description: "Generate a non-permanent, single-use invite to this server."
  })
  async generateInvite(interaction: CommandInteraction) {
    if (!interaction.inGuild()) {
      throw new Error("Command must be used within a guild!");
    }
    const { guild } = interaction;
    if (guild) {
      const { channels, roles } = guild;
      const visibleChannel = channels.cache.find((ch) => ch.isTextBased() && !ch.isDMBased() && !ch.isVoiceBased() && ch.permissionsFor(roles.everyone).has(PermissionsBitField.Flags.ViewChannel)) as TextChannel;
      const invite = await interaction.guild?.invites.create(visibleChannel!, {
        maxUses: 1,
        maxAge: TimeUnit.WEEK / 1000, // field takes time in seconds instead of milliseconds
        temporary: false,
      });
      await interaction.reply({
        content: `Please copy this invite link and send it to whomever you wish. It is single use and will last 1 week.\n*Note:* Inviting someone to this server is equivalent to you vouching for them. Ensure this person is someone you trust.\n\n${invite?.url}`,
        ephemeral: true,
      });
      await this._logger.log(interaction, CommandActions.Invite);
    }
  }
}
