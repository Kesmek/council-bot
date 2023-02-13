import {
  Client,
  Discord,
  Guard,
  Slash,
  SlashChoice,
  SlashOption,
} from "discordx";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  Attachment,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  ForumChannel,
  MessageActionRowComponentBuilder,
  User,
} from "discord.js";
import { DbUtils, GuildUtils, InteractionUtils } from "../utils/Utils.js";
import { injectable } from "tsyringe";
import { User as VRC_User } from "vrchat";
import { IsForumSetup, IsSetup } from "../guards/IsSetup.js";
import { BlacklistReasons, BotCreator, TimeUnit } from "../utils/Constants.js";
import { EnumChoice } from "@discordx/utilities";
import { VRC_UsersApi } from "../utils/VRC_API.js";


@Discord()
@injectable()
@Guard(IsSetup)
@Guard(IsForumSetup)
export class Blacklist {
  constructor(
    private _client: Client,
    private _VRC_UsersApi: VRC_UsersApi,
  ) { }

  @Slash({ name: "blacklist", description: "Blacklist a user" })
  public async blacklist(
    @SlashChoice(...EnumChoice(BlacklistReasons))
    @SlashOption({
      name: "reason",
      description: "The reason why the user is being blacklisted",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    reason: string,
    @SlashOption({
      name: "post-anonymously",
      description: "Whether you'd like this post to be anonymous",
      type: ApplicationCommandOptionType.Boolean,
      required: true,
    })
    anonymous: boolean,
    @SlashOption({
      name: "evidence-link",
      description: "A link to an online document containing evidence corroborating the blacklist",
      type: ApplicationCommandOptionType.String,
    })
    evidenceLink: string | undefined,
    @SlashOption({
      name: "evidence-file-1",
      description: "Either a link to a google doc containing the evidenceFile1 or images/videos of the evidenceFile1",
      type: ApplicationCommandOptionType.Attachment,
    })
    evidenceFile1: Attachment | undefined,
    @SlashOption({
      name: "evidence-file-2",
      description: "Additional source of evidenceFile1 to corroborate the blacklist",
      type: ApplicationCommandOptionType.Attachment,
    })
    evidenceFile2: Attachment | undefined,
    @SlashOption({
      name: "evidence-file-3",
      description: "Additional source of evidenceFile1 to corroborate the blacklist",
      type: ApplicationCommandOptionType.Attachment,
    })
    evidenceFile3: Attachment | undefined,
    @SlashOption({
      name: "discord-id",
      description: "The user's discord id",
      type: ApplicationCommandOptionType.String,
    })
    discordId: string | undefined,
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
    if (!interaction.inGuild()) {
      throw new Error("Command must be used within a guild!");
    }
    await interaction.deferReply({ ephemeral: true });

    let title = "";
    let dUser: User | null = null;
    let vUser: VRC_User | null = null;
    const admins = GuildUtils.getAdmins(interaction);

    const submitter = anonymous ? "Anonymous" : GuildUtils.safeMention(interaction.user);

    // Ensure at least one form of identification is provided 
    if (!discordId && !vrcLink) {
      return await InteractionUtils.replyOrFollowUp(interaction, {
        content: "Either a discord ID or a link to their VRC profile is required!",
        ephemeral: true,
      });
    }

    // Ensure at least one piece of evidence is provided
    if (!(evidenceLink || evidenceFile1 || evidenceFile2 || evidenceFile3)) {
      return await InteractionUtils.replyOrFollowUp(interaction, {
        content: "At least one piece of evidence (linked or images/videos) is required!",
        ephemeral: true,
      });
    }

    // Get discord account info
    if (discordId) {
      try {
        dUser = await this._client.users.fetch(discordId);
        title += `Discord: ${dUser.tag}`;
      } catch (e) {
        console.error(e);
        return await InteractionUtils.replyOrFollowUp(interaction, {
          content: `Something went wrong while fetching the discord ID. If you're sure that you input the correct ID, contact ${BotCreator}.`,
          ephemeral: true,
        });
      }
    }

    // Get VRC account info
    if (vrcLink) {
      try {
        let link = vrcLink;
        if (vrcLink.endsWith("/")) {
          link = vrcLink.slice(0, vrcLink.length - 1);
        }
        const response = await (await this._VRC_UsersApi.get()).getUser(link.split("/").at(-1)!);
        vUser = response.data;
        title += title ? `, VRChat: ${vUser.displayName}` : `VRChat: ${vUser.displayName}`;
      } catch (e) {
        console.error(e);
        return await InteractionUtils.replyOrFollowUp(interaction, {
          content: `Something went wrong while fetching the VRChat ID. If you're sure that you input the correct link, contact ${BotCreator}.`,
          ephemeral: true,
        });
      }
    }

    // Attach only defined attachments
    const evidenceFiles: Attachment[] = [];
    if (evidenceFile1) {
      evidenceFiles.push(evidenceFile1);
    }
    if (evidenceFile2) {
      evidenceFiles.push(evidenceFile2);
    }
    if (evidenceFile3) {
      evidenceFiles.push(evidenceFile3);
    }

    // Get + check guild in DB (already checked by Guard on this class)
    const guild = await DbUtils.getGuild(interaction.guildId);
    const blacklistChannel = await interaction.guild?.channels.fetch(guild.blacklistChannel!);

    // Only proceed if the blaklist channel is a forum channel
    if (blacklistChannel instanceof ForumChannel) {
      const formattedContent = this.formatBlacklist(submitter, dUser, vUser, evidenceLink, otherAccounts, additionalInfo);
      const pendingTag = guild.forumPendingTagId!;
      const invalidTag = guild.forumInvalidTagId!;
      const validTag = guild.forumValidTagId!;
      const tags = blacklistChannel.availableTags
        .filter((tag) => tag.name.toLowerCase() === reason || tag.id === pendingTag)
        .map((tag) => tag.id);

      const post = await blacklistChannel.threads.create({
        name: title,
        message: {
          content: formattedContent,
          files: evidenceFiles,
        },
        appliedTags: tags
      });

      const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("validate")
          .setLabel("Validate")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("invalidate")
          .setLabel("Invalidate")
          .setStyle(ButtonStyle.Danger)
      );

      const voteMessage = `Please vote as to whether this post should be validated as a confirmed blacklist.\n\n*Note:* This thread will be automatically validated if the positive votes outnumber the negative ones. If the negative votes outnumber the positive ones, this post will be automatically marked invalid.`;
      const followup = await post.send({
        content: voteMessage,
        components: [row],
      });

      const validateVotes = new Set<string>(), invalidateVotes = new Set<string>();
      const collector = followup.createMessageComponentCollector({ idle: TimeUnit.DAY * 2 });
      collector.on("collect", async (collectorInteraction: ButtonInteraction) => {
        const userId = collectorInteraction.user.id;

        const skipValidate = validateVotes.delete(userId);
        const skipInvalidate = invalidateVotes.delete(userId);

        switch (collectorInteraction.customId) {
          case "validate": {
            if (!skipValidate) {
              validateVotes.add(userId);
            }
            break;
          }
          case "invalidate": {
            if (!skipInvalidate) {
              invalidateVotes.add(userId);
            }
            break;
          }
        }

        await collectorInteraction.update({
          content: `${voteMessage}\n\nValidate: ${validateVotes.size}\nInvalidate: ${invalidateVotes.size}`,
        });
      });

      collector.on("end", async () => {
        await followup.delete();
        await post.send({
          content: `This post has been validated. If you disagree with this decision, please contact an admin: ${admins}`,
        });
        if (validateVotes.size > invalidateVotes.size) {
          await post.edit({
            appliedTags: [...tags, validTag].filter((tag) => tag !== pendingTag),
          });
        } else {
          await post.edit({
            appliedTags: [...tags, invalidTag].filter((tag) => tag !== pendingTag),
          });
        }
      });

      await InteractionUtils.replyOrFollowUp(interaction, {
        content: `Blacklist created successfully in channel ${blacklistChannel}.`,
        ephemeral: true,
      });
    } else {
      return await InteractionUtils.replyOrFollowUp(interaction, {
        content: "Target channel is not a forum channel. Please rerun the setup-forums command.",
        ephemeral: true,
      });
    }
  }

  private formatBlacklist(
    submitter: string,
    discordUser: User | null,
    VRC_User: VRC_User | null,
    evidenceLink?: string,
    otherAccounts?: string,
    additionalInfo?: string
  ): string {
    let formatted = `**Submitted By:** ${submitter}\n`;
    if (discordUser) {
      formatted += `\n**Discord User:** ${discordUser.tag} (${discordUser.id})`;
    }
    if (VRC_User) {
      formatted += `\n**VRChat User:** ${VRC_User.displayName} (${VRC_User.id})`;
    }
    if (otherAccounts) {
      formatted += `\n**Other Accounts:** ${otherAccounts}`;
    }
    if (additionalInfo) {
      formatted += `\n**Additional Info:** ${additionalInfo}`;
    }
    if (evidenceLink) {
      formatted += `\n**Evidence:** ${evidenceLink}`;
    }

    return formatted;
  }
}
