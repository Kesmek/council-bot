import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import {
  ApplicationCommandOptionType,
  Attachment,
  CommandInteraction,
} from "discord.js";
import { InteractionUtils } from "../utils/Utils";

@Discord()
@SlashGroup({ name: "blacklist", description: "Blacklist a user" })
@SlashGroup("blacklist")
class Blacklist {
  @Slash({ name: "user", description: "Blacklist a non-minor user" })
  async user(
    interaction: CommandInteraction,
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
      tag?: string,
    @SlashOption({
      name: "discord-id",
      description: "The user's discord id",
      type: ApplicationCommandOptionType.Number,
    })
      id?: number,
    @SlashOption({
      name: "vrc-account",
      description: "The user's vrchat account link",
      type: ApplicationCommandOptionType.String,
    })
      vrcLink?: string,
    @SlashOption({
      name: "other-accounts",
      description: "Any other relevant accounts the user might have",
      type: ApplicationCommandOptionType.String,
    })
      otherAccounts?: string,
    @SlashOption({
      name: "summary",
      description: "A summary of why the user is being blacklisted",
      type: ApplicationCommandOptionType.String,
    })
      summary?: string,
    @SlashOption({
      name: "additional-info",
      description: "Any additional information on this blacklist post",
      type: ApplicationCommandOptionType.String,
    })
      additionalInfo?: string,
  ) {
    if (!(id || tag) && !vrcLink) {
      return InteractionUtils.replyOrFollowUp(interaction, {
        content: "You must provide either a discord id/tag or a vrc account" +
          " link. If possible, both is preferred.",
        ephemeral: true,
      });
    }
  }

  @Slash({ name: "minor", description: "Blacklist a minor" })
  async minor(
    @SlashOption({
      name: "evidence",
      description: "A link to the evidence that corroborates your claim",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
      evidence: Attachment,
    @SlashOption({
      name: "discord-tag",
      description: "The user's discord tag",
      type: ApplicationCommandOptionType.String,
    })
      tag: string,
    @SlashOption({
      name: "discord-id",
      description: "The user's discord id",
      type: ApplicationCommandOptionType.Number,
    })
      id: number,
    @SlashOption({
      name: "vrc-account",
      description: "The user's vrchat account link",
      type: ApplicationCommandOptionType.String,
    })
      vrcLink: string,
    @SlashOption({
      name: "other-accounts",
      description: "Any other relevant accounts the user might have",
      type: ApplicationCommandOptionType.String,
    })
      otherAccounts: string,
    @SlashOption({
      name: "additional-info",
      description: "Any additional information on this blacklist post",
      type: ApplicationCommandOptionType.String,
    })
      additionalInfo: string,
    interaction: CommandInteraction,
  ) {

  }
}
