import { PrismaClient } from "@prisma/client";
import { singleton } from "tsyringe";
import { CommandInteraction, GuildMember, TextChannel, User } from "discord.js";
import { CommandActions } from "./Constants.js";
import { EmbedUtils, InteractionUtils } from "./Utils.js";

@singleton()
export class Logger {
  constructor(private _prisma: PrismaClient) {
  }

  /**
   * Logs a moderation action to the moderation channel, properly formatted.
   *
   * @param interaction
   * @param moderationAction
   * @param targetUser
   * @param targetRole
   */
  public async log(
    interaction: CommandInteraction,
    moderationAction: CommandActions,
    targetUser: GuildMember | User,
    targetRole?: string,
  ) {
    const guildInfo = await this._prisma.guild.findFirst({
      where: {
        id: interaction.guild?.id,
      },
    });
    if (!guildInfo?.moderationChannel || !guildInfo?.verifiedRole) {
      await InteractionUtils.replyOrFollowUp(interaction, {
        content: "An error occurred while retrieving the guild info. Please" +
          " Contact the bot creator. Use `/credits` if you need more info on" +
          " the creator of this bot.",
      });
      return null;
    }
    const modChannel = await interaction.guild?.channels.fetch(guildInfo.moderationChannel) as TextChannel;
    const embed = EmbedUtils.createLogEmbed(
      interaction,
      moderationAction,
      targetUser,
      targetRole,
    );
    await modChannel.send({
      embeds: [embed],
    });
  }
}
