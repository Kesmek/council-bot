import {
  Discord,
  Guard,
  Slash,
  SlashChoice,
  SlashGroup,
  SlashOption,
} from "discordx";
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  TextChannel,
} from "discord.js";
import { EmbedUtils, InteractionUtils } from "../utils/Utils.js";
import { injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import { IsSetup } from "../guards/IsSetup.js";
import { BlacklistReasons } from "../utils/Constants.js";
import { EnumChoice } from "@discordx/utilities";

@Discord()
@injectable()
@Guard(IsSetup)
@SlashGroup({ name: "blacklist", description: "Blacklist a user" })
@SlashGroup("blacklist")
export class Blacklist {
  constructor(private _prisma: PrismaClient) {
  }

  @Slash({ name: "user", description: "Blacklist a non-minor user" })
  public async user(
    @SlashOption({
      name: "evidence",
      description: "A link to the evidence that corroborates your claim",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
      evidence: string,
    @SlashChoice(...EnumChoice(BlacklistReasons))
    @SlashOption({
      name: "reason",
      description: "The reason why the user is being blacklisted",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
      reason: string,
    @SlashOption({
      name: "discord-tag",
      description: "The user's discord tag",
      type: ApplicationCommandOptionType.String,
    })
      tag: string | undefined,
    @SlashOption({
      name: "discord-id",
      description: "The user's discord id",
      type: ApplicationCommandOptionType.String,
    })
      id: string | undefined,
    @SlashOption({
      name: "vrc-account",
      description: "The user's vrchat account link",
      type: ApplicationCommandOptionType.String,
    })
      vrcLink: string | undefined,
    @SlashOption({
      name: "other-accounts",
      description: "Any other relevant accounts the user might have",
      type: ApplicationCommandOptionType.String,
    })
      otherAccounts: string | undefined,
    @SlashOption({
      name: "additional-info",
      description: "Any additional information on this blacklist post",
      type: ApplicationCommandOptionType.String,
    })
      additionalInfo: string | undefined,
    interaction: CommandInteraction,
  ) {
    if (!(id || tag) && !vrcLink) {
      return InteractionUtils.replyOrFollowUp(interaction, {
        content: "You must provide either a discord id/tag or a vrc account" +
          " link. If possible, both is preferred.",
        ephemeral: true,
      });
    }
    const guild = (await this._prisma.guild.findFirst({
      where: {
        id: interaction.guildId!,
      },
    }))!;
    const blacklistChannel = await interaction.guild?.channels.fetch(guild.userBlacklistChannel!) as TextChannel;
    if (!blacklistChannel) {
      return InteractionUtils.replyOrFollowUp(interaction, {
          content: "Cannot find channel, make sure it hasn't been deleted and" +
            " if so, run `/setup` again to reassign a channel for blacklists.",
          ephemeral: true,
        },
      );
    }
    const embed = EmbedUtils.createBlacklistEmbed(
      interaction,
      evidence,
      reason,
      id,
      tag,
      vrcLink,
      otherAccounts,
      additionalInfo,
    );
    await blacklistChannel.send({
      embeds: [embed],
    });
    return InteractionUtils.replyOrFollowUp(interaction, {
      content: `Blacklist created successfully in channel ${blacklistChannel}.`,
      ephemeral: true,
    });
  }

  @Slash({ name: "minor", description: "Blacklist a minor" })
  async minor(
    @SlashOption({
      name: "evidence",
      description: "A link to the evidence that corroborates your claim",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
      evidence: string,
    @SlashOption({
      name: "discord-tag",
      description: "The user's discord tag",
      type: ApplicationCommandOptionType.String,
    })
      tag: string | undefined,
    @SlashOption({
      name: "discord-id",
      description: "The user's discord id",
      type: ApplicationCommandOptionType.String,
    })
      id: string | undefined,
    @SlashOption({
      name: "vrc-account",
      description: "The user's vrchat account link",
      type: ApplicationCommandOptionType.String,
    })
      vrcLink: string | undefined,
    @SlashOption({
      name: "other-accounts",
      description: "Any other relevant accounts the user might have",
      type: ApplicationCommandOptionType.String,
    })
      otherAccounts: string | undefined,
    @SlashOption({
      name: "additional-info",
      description: "Any additional information on this blacklist post",
      type: ApplicationCommandOptionType.String,
    })
      additionalInfo: string | undefined,
    interaction: CommandInteraction,
  ) {
    if (!(id || tag) && !vrcLink) {
      return InteractionUtils.replyOrFollowUp(interaction, {
        content: "You must provide either a discord id/tag or a vrc account" +
          " link. If possible, both is preferred.",
        ephemeral: true,
      });
    }
    const guild = (await this._prisma.guild.findFirst({
      where: {
        id: interaction.guildId!,
      },
    }))!;
    const minorChannel = await interaction.guild?.channels.fetch(guild.minorBlacklistChannel!) as TextChannel;
    if (!minorChannel) {
      return InteractionUtils.replyOrFollowUp(interaction, {
          content: "Cannot find channel, make sure it hasn't been deleted and" +
            " if so, run `/setup` again to reassign a channel for blacklists.",
          ephemeral: true,
        },
      );
    }
    const embed = EmbedUtils.createBlacklistEmbed(
      interaction,
      evidence,
      BlacklistReasons.Underaged,
      id,
      tag,
      vrcLink,
      otherAccounts,
      additionalInfo,
    );
    await minorChannel.send({
      embeds: [embed],
    });
    return InteractionUtils.replyOrFollowUp(interaction, {
      content: `Blacklist created successfully in channel ${minorChannel}.`,
      ephemeral: true,
    });
  }
}
