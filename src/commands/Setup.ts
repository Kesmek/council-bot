import { PrismaClient } from "@prisma/client";
import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ChannelType,
  CommandInteraction,
  ForumChannel,
  Role,
  TextChannel,
} from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { injectable } from "tsyringe";
import { DbUtils, InteractionUtils } from "../utils/Utils.js";
import { IsSetup } from "../guards/IsSetup.js";

@Discord()
@injectable()
export class Setup {
  constructor(private _prisma: PrismaClient) {
  }

  @Slash({
    name: "setup", description: "Run the first time setup for this bot",
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
      name: "blacklist-channel",
      description: "Channel where blacklists will be posted",
      type: ApplicationCommandOptionType.Channel,
      channelTypes: [ChannelType.GuildForum],
      required: true,
    })
    blacklistChannel: ForumChannel,
    @SlashOption({
      name: "server-share-channel",
      description: "Channel where each server's information will be posted",
      type: ApplicationCommandOptionType.Channel,
      channelTypes: [ChannelType.GuildText],
      required: true,
    })
    serversChannel: TextChannel,
    interaction: CommandInteraction,
  ) {
    if (interaction.guildId) {
      await this._prisma.guild.update({
        where: {
          id: interaction.guildId,
        },
        data: {
          moderationChannel: modChannel.id,
          verifiedRole: verifiedRole.id,
          blacklistChannel: blacklistChannel.id,
          serversChannel: serversChannel.id
        },
      });
      await InteractionUtils.replyOrFollowUp(interaction, {
        content: "Bot successfully setup! All the bot commands should now function properly",
        ephemeral: true,
      });
    } else {
      await InteractionUtils.replyOrFollowUp(interaction, {
        content: "Something went wrong, please try again later or contact the bot owner.",
        ephemeral: true,
      });
    }
  }

  @Guard(IsSetup)
  @Slash({ name: "setup-forums", description: "Setup the forum channels for the blacklisting system" })
  async setupForums(
    @SlashOption({
      name: "forum-pending-tag",
      description: "Tag given to posts that have not yet been validated as a blacklist",
      type: ApplicationCommandOptionType.String,
      autocomplete: async function(this: Setup, interaction: AutocompleteInteraction) {
        const guild = await DbUtils.getGuild(interaction.guildId!);
        const blacklistChannel = await interaction.guild?.channels.fetch(guild.blacklistChannel!);
        if (blacklistChannel instanceof ForumChannel) {
          interaction.respond(blacklistChannel.availableTags.map((tag) => {
            return {
              name: tag.name,
              value: tag.id,
            }
          }));
        }
      },
      required: true,
    })
    forumPendingTag: string,
    @SlashOption({
      name: "forum-valid-tag",
      description: "Tag given to posts that have been validated as a blacklist",
      type: ApplicationCommandOptionType.String,
      autocomplete: async function(this: Setup, interaction: AutocompleteInteraction) {
        const guild = await DbUtils.getGuild(interaction.guildId!);
        const blacklistChannel = await interaction.guild?.channels.fetch(guild.blacklistChannel!);
        if (blacklistChannel instanceof ForumChannel) {
          interaction.respond(blacklistChannel.availableTags.map((tag) => {
            return {
              name: tag.name,
              value: tag.id,
            }
          }));
        }
      },
      required: true,
    })
    forumValidTag: string,
    @SlashOption({
      name: "forum-invalid-tag",
      description: "Tag given to posts that have been validated as a blacklist",
      type: ApplicationCommandOptionType.String,
      autocomplete: async function(this: Setup, interaction: AutocompleteInteraction) {
        const guild = await DbUtils.getGuild(interaction.guildId!);
        const blacklistChannel = await interaction.guild?.channels.fetch(guild.blacklistChannel!);
        if (blacklistChannel instanceof ForumChannel) {
          interaction.respond(blacklistChannel.availableTags.map((tag) => {
            return {
              name: tag.name,
              value: tag.id,
            }
          }));
        }
      },
      required: true,
    })
    forumInvalidTag: string,
    interaction: CommandInteraction,
  ) {
    await this._prisma.guild.update({
      where: {
        id: interaction.guildId!,
      },
      data: {
        forumPendingTagId: forumPendingTag,
        forumValidTagId: forumValidTag,
        forumInvalidTagId: forumInvalidTag,
      }
    });
    return await InteractionUtils.replyOrFollowUp(interaction, {
      content: "Forum channels successfully setup!",
      ephemeral: true,
    });
  }
}

