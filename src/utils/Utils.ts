import {
  Collection,
  CommandInteraction,
  EmbedBuilder,
  GuildMember,
  Interaction,
  InteractionReplyOptions,
  MessageComponentInteraction,
  PermissionsBitField,
  User,
} from "discord.js";
import { CommandActions } from "./Constants.js";

export class InteractionUtils {
  public static async replyOrFollowUp(
    interaction: MessageComponentInteraction | CommandInteraction,
    replyOptions: InteractionReplyOptions | string,
  ): Promise<void> {
    // if interaction is already replied
    if (interaction.replied) {
      await interaction.followUp(replyOptions);
      return;
    }

    // if interaction is deferred but not replied
    if (interaction.deferred) {
      await interaction.editReply(replyOptions);
      return;
    }

    // if interaction is not handled yet
    await interaction.reply(replyOptions);
  }
}

export class EmbedUtils {
  public static createLogEmbed(
    interaction: CommandInteraction,
    commandAction: CommandActions,
    targetUser: GuildMember | User,
    targetRole?: string | null,
  ) {
    const role = interaction.guild?.roles.cache.get(targetRole ?? "");
    return new EmbedBuilder()
    .setTitle(`${commandAction}er Created`)
    .setAuthor({
      name: `${interaction.user.tag} (${interaction.user.id})`,
      iconURL: interaction.user.avatarURL() ?? "",
    })
    .setColor(role?.color ?? "Default")
    .setDescription(
      `**User:** ${GuildUtils.safeMention(targetUser)}\n` +
      `**ID:** ${targetUser.id}\n\n` +
      (commandAction === CommandActions.Vouch
        ? `__${commandAction}ed for by__\n\n` +
        `**User:** ${GuildUtils.safeMention(interaction.user)}\n` +
        `**ID:** ${interaction.user.id}`
        : ""),
    )
    .setThumbnail(targetUser.displayAvatarURL());
  }

  public static createBlacklistEmbed(
    interaction: CommandInteraction,
    evidence: string,
    reason: string,
    id?: string,
    tag?: string,
    vrcLink?: string,
    otherAccounts?: string,
    additionalInfo?: string,
  ) {
    return new EmbedBuilder()
    .setTitle(`User Blacklisted`)
    .setColor("Red")
    .setDescription(
      `**Reason:** ${reason ?? "-"}\n` +
      `**Discord Tag:** ${tag ?? "-"}\n` +
      `**Discord ID:** ${id ?? "-"}\n` +
      `**VRChat Profile:** ${vrcLink ?? "-"}\n` +
      `**Other Accounts:** ${otherAccounts ?? "-"}\n` +
      `**Additional Info:** ${additionalInfo ?? "-"}\n` +
      `**Evidence:** ${evidence ?? "-"}\n`,
    );
  }
}

export class GuildUtils {
  public static async getAdmins(
    interaction: Interaction,
  ) {
    return interaction.guild?.members.cache.filter((member) => !member.user.bot && member.permissions.has(
      [PermissionsBitField.Flags.BanMembers]));
  }

  public static stringifyMembers(members?: Collection<string, GuildMember>) {
    if (!members) {
      return "";
    }
    return members?.map((member) => `${member.user} (${member.user.username}#${member.user.discriminator})`)
    .join(", ");
  }

  public static safeMention(user: User | GuildMember) {
    if (user instanceof User) {
      return `${user} (${user.tag})`;
    } else {
      return `${user.user} (${user.user.tag})`;
    }
  }
}
