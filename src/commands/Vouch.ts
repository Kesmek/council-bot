import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  CommandInteraction,
  GuildMember,
  UserContextMenuCommandInteraction,
} from "discord.js";
import { ContextMenu, Discord, Guard, Slash, SlashOption } from "discordx";
import { InteractionUtils } from "../utils/Utils.js";
import { CommandActions } from "../utils/Constants.js";
import { injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import { IsSetup } from "../guards/IsSetup.js";
import { Logger } from "../utils/Logger.js";

@Discord()
@injectable()
@Guard(IsSetup)
export class Vouch {
  constructor(
    private _prisma: PrismaClient,
    private _logger: Logger,
  ) {
  }

  @ContextMenu({ name: "user context", type: ApplicationCommandType.User })
  async userHandler(interaction: UserContextMenuCommandInteraction): Promise<void> {
    const member = await interaction.guild?.members.fetch(interaction.targetUser.id);
    if (member) {
      await this.vouch(member, interaction);
    } else {
      await interaction.reply({
        content: "This context command may only be used in a server!",
        ephemeral: true,
      });
    }
  }

  @Slash({
    description: "Vouch for another member. You will be investigated if they" +
      " break any rules.",
    name: "vouch",
  })
  async vouch(
    @SlashOption({
      name: "user",
      description: "User whom you will be vouching for",
      type: ApplicationCommandOptionType.User,
      required: true,
    })
      user: GuildMember,
    interaction: CommandInteraction,
  ): Promise<void> {
    //Guaranteed exists because of the guard
    const guild = (await this._prisma.guild.findUnique({
      where: {
        id: interaction.guildId!,
      },
      select: {
        moderationChannel: true,
        verifiedRole: true,
      },
    }))!;
    const { verifiedRole } = guild;
    if (user.id === interaction.user.id) {
      return InteractionUtils.replyOrFollowUp(interaction, {
        content: "You cannot vouch for yourself!",
        ephemeral: true,
      });
    }
    if (user.roles.cache.has(verifiedRole!)) {
      return InteractionUtils.replyOrFollowUp(interaction, {
        content: "This user has already been vouched for!",
        ephemeral: true,
      });
    }
    await user.roles.add(verifiedRole!);
    await this._logger.log(interaction, CommandActions.Vouch, user);
    return InteractionUtils.replyOrFollowUp(interaction, {
      content: `You've vouched for ${user}. Keep in mind that you will be now be ` +
        `accountable for this user and may be investigated if they break any rules.`,
      ephemeral: true,
    });
  }
}
