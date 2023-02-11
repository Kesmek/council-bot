import { Guild, PrismaClient } from "@prisma/client";
import { singleton } from "tsyringe";
import { Colors, CommandInteraction, EmbedBuilder, GuildMember } from "discord.js";
import { CommandActions } from "./Constants.js";
import { GuildUtils, NoOptionals } from "./Utils.js";


@singleton()
export class Logger {
  private guild: Guild | null = null;
  constructor(private _prisma: PrismaClient) {
  }

  private getGuild = async (guildId: string): Promise<NoOptionals<Guild>> => {
    if (!this.guild) {
      this.guild = await this._prisma.guild.findUniqueOrThrow({
        where: {
          id: guildId,
        },
      });
    }
    return this.guild as NoOptionals<Guild>;
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
    interaction: CommandInteraction<"cached" | "raw">,
    moderationAction: CommandActions,
    extraUser?: GuildMember,
  ): Promise<void> {
    const user = interaction.member as GuildMember;
    const color = moderationAction === CommandActions.Verify ? Colors.Green : Colors.Blurple;
    let description = `**User:** ${GuildUtils.safeMention(user)}\n**ID:** ${user.id}\n`;

    if (moderationAction === CommandActions.Verify && extraUser) {
      description += `**Invited By:** ${GuildUtils.safeMention(extraUser)}`;
    }

    const embed = new EmbedBuilder()
      .setTitle(moderationAction)
      .setColor(color)
      .setDescription(description)
      .setThumbnail(user.displayAvatarURL());

    await this.sendLog(interaction, embed);
  }

  public async warn(
    interaction: CommandInteraction<"cached" | "raw">,
    moderationAction: CommandActions,
    message: string,
    extraInfo?: string,
  ) {
    let user = interaction.member as GuildMember;
    let description = `**User:** ${GuildUtils.safeMention(user)}\n**ID:** ${user.id}\n**Reason:** ${message}`;

    if (extraInfo) {
      description += `\n\n${extraInfo}`;
    }

    const embed = new EmbedBuilder()
      .setTitle(moderationAction)
      .setColor(Colors.Yellow)
      .setDescription(description)
      .setThumbnail(user.displayAvatarURL())

    await this.sendLog(interaction, embed);
  }

  private async sendLog(
    interaction: CommandInteraction<"cached" | "raw">,
    embed: EmbedBuilder) {
    const guild = await this.getGuild(interaction.guildId);
    const modChannel = await interaction.guild?.channels.fetch(guild.moderationChannel);
    if (modChannel?.isTextBased()) {
      await modChannel?.send({
        embeds: [embed],
      });
    } else {
      console.error(`Cannot send embed to log channel (${modChannel})`);
    }
  }
}
