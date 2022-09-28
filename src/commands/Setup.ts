import { PrismaClient } from "@prisma/client";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelType,
  CommandInteraction,
  Role,
  TextChannel,
} from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { injectable } from "tsyringe";
import { InteractionUtils } from "../utils/Utils.js";

@Discord()
@injectable()
export class Setup {
  constructor(private _prisma: PrismaClient) {
  }

  @Slash({
    name: "setup", description: "run the first time setup for this bot",
  })
  async setup(
    @SlashOption({
      name: "moderator-logs",
      description: "Channel where moderation actions will be logged",
      type: ApplicationCommandOptionType.Channel,
      channelTypes: [ChannelType.GuildText],
      required: true,
    })
      modChannel: TextChannel,
    @SlashOption({
      name: "verified-role",
      description: "Role given to a user who has been vouched for",
      type: ApplicationCommandOptionType.Role,
      required: true,
    })
      verifiedRole: Role,
    @SlashOption({
      name: "user-blacklist-channel",
      description: "Channel where user blacklists will be posted",
      type: ApplicationCommandOptionType.Channel,
      channelTypes: [ChannelType.GuildText],
      required: true,
    })
      userBlacklistChannel: TextChannel,
    @SlashOption({
      name: "minor-blacklist-channel",
      description: "Channel where user blacklists specifically for minors" +
        " will be posted",
      type: ApplicationCommandOptionType.Channel,
      channelTypes: [ChannelType.GuildText],
      required: true,
    })
      minorBlacklistChannel: TextChannel,
    interaction: CommandInteraction,
  ) {
    await this._prisma.guild.update({
      where: {
        id: interaction.guildId ?? undefined,
      },
      data: {
        moderationChannel: modChannel.id,
        verifiedRole: verifiedRole.id,
        minorBlacklistChannel: minorBlacklistChannel.id,
        userBlacklistChannel: userBlacklistChannel.id,
      },
    });
    await InteractionUtils.replyOrFollowUp(interaction, {
      content: "Bot successfully setup! New users may now be vouched for by" +
        " existing users using the `/vouch` command.",
      ephemeral: true,
    });
  }
}
