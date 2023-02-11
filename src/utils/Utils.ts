import {
  ButtonInteraction,
  Collection,
  CommandInteraction,
  GuildMember,
  InteractionReplyOptions,
  MessageComponentInteraction,
  PermissionsBitField,
  User,
} from "discord.js";
import { container } from "tsyringe";
import { Guild, PrismaClient } from "@prisma/client";

export class InteractionUtils {
  public static async replyOrFollowUp(
    interaction: CommandInteraction | MessageComponentInteraction,
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

export class GuildUtils {
  public static getAdmins(
    interaction: CommandInteraction | ButtonInteraction,
  ) {
    return interaction.guild?.members.cache.filter((member) => !member.user.bot && member.permissions.has(
      [PermissionsBitField.Flags.BanMembers])).toJSON();
  }

  public static stringifyMembers(members?: Collection<string, GuildMember>) {
    if (!members) {
      return "";
    }
    return members?.map((member) => `${member.user} (${member.user.tag})`)
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

export class DbUtils {
  public static async getGuild(guildId: string): Promise<NoOptionals<Guild>> {
    const _prisma = container.resolve(PrismaClient);
    return await _prisma.guild.findUniqueOrThrow({
      where: {
        id: guildId,
      }
    }) as NoOptionals<Guild>;
  }
}

export type NoOptionals<T> = { [P in keyof T]: NonNullable<T[P]> };
