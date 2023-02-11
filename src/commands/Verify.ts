import {
  ApplicationCommandOptionType,
  CommandInteraction,
  GuildMember,
  InviteGuild,
  TextChannel,
} from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { DbUtils, GuildUtils, InteractionUtils } from "../utils/Utils.js";
import { CommandActions } from "../utils/Constants.js";
import { injectable } from "tsyringe";
import { IsSetup } from "../guards/IsSetup.js";
import { Logger } from "../utils/Logger.js";

@Discord()
@injectable()
@Guard(IsSetup)
export class Verify {
  constructor(
    private _logger: Logger,
  ) { }

  @Slash({
    description: "Verify yourself as a server owner.",
    name: "verify",
  })
  async verify(
    @SlashOption({
      name: "invited-by",
      description: "User who invited you to this server.",
      type: ApplicationCommandOptionType.User,
      required: true,
    })
    inviter: GuildMember,
    @SlashOption({
      name: "permanent-server-invite",
      description: "A *permanent* invite to the server you own.",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    serverInvite: string,
    @SlashOption({
      name: "other-owner",
      description: "Enter the other owner you have in this server.",
      type: ApplicationCommandOptionType.User,
      required: false,
    })
    otherOwner: GuildMember | undefined,
    interaction: CommandInteraction,
  ): Promise<void> {
    if (!interaction.inGuild()) {
      throw new Error("Command must be used within a guild!");
    }
    //Guaranteed exists because of the guard
    const guild = await DbUtils.getGuild(interaction.guildId);
    const { verifiedRole, serversChannel } = guild;
    const member = interaction.member as GuildMember;
    const rules = interaction.guild?.rulesChannel!;
    const serverInfoChannel = await interaction.guild?.channels.fetch(serversChannel) as TextChannel;

    const invite = await interaction.client.fetchInvite(serverInvite);
    const inviteGuild = invite.guild as InviteGuild;
    const { memberCount } = invite;
    const { name: guildName } = inviteGuild;

    if (member.nickname?.includes(guildName)) {
      return await InteractionUtils.replyOrFollowUp(interaction, {
        content: "You've already been verified for this club!",
        ephemeral: true,
      });
    }

    if (otherOwner) {
      // Make sure other owner is already verified
      if (!otherOwner.roles.cache.get(verifiedRole)) {
        return await InteractionUtils.replyOrFollowUp(interaction, {
          content: `Please invoke this command without the other owner if they have not been verified yet (The other owner cannot be yourself). Here is your invite link for you copy-paste convenience ${invite.url}`,
          ephemeral: true,
        });
      } else {
        // Assume other owner has been verified correctly
        await this.verifySuccess(interaction, member, verifiedRole, guildName)
      }
    }

    if (memberCount >= 150) {
      await member.roles.add(verifiedRole);
      let nick = "";
      if (member.nickname) {
        nick = `${member.nickname.slice(0, member.nickname.length - 1)}, ${guildName})`;
        if (nick.length > 32) {
          nick = nick.slice(0, 29) + "...)";
        }
        await member.setNickname(nick);
      } else {
        nick = `${member.displayName} (${guildName})`;
        if (nick.length > 32) {
          nick = nick.slice(0, 29) + "...)";
        }
        await member.setNickname(nick);
      }

      // Send server info to appropriate channel (if another owner hasn't already)
      if (!otherOwner) {
        await serverInfoChannel.send({
          content: invite.url,
        });
      }
      await this._logger.log(interaction, CommandActions.Verify, inviter);
      return InteractionUtils.replyOrFollowUp(interaction, {
        content: `You have been verified. If you haven't already done so, please read the ${rules}.`,
        ephemeral: true,
      });
    } else {
      let infoForAdmins = `__Info For Manual Verification__\n**Inviter:** ${GuildUtils.safeMention(inviter)}\n**Server Link:** ${invite.url}`;

      if (otherOwner) {
        infoForAdmins += `\n**Other Owner:** ${GuildUtils.safeMention(otherOwner)}`;
      }

      await this._logger.warn(interaction, CommandActions.VerifyFail, "Their Server doesn't meet the 150 member minimum requirements", infoForAdmins);
      return InteractionUtils.replyOrFollowUp(interaction, {
        content: `Your server must have at least 150 members in it to verify. Please read the ${rules} and contact the admins (${GuildUtils.getAdmins(interaction)}) if you believe you are an exception.`,
        ephemeral: true,
      });
    }
  }

  @Slash({
    name: "force-verify",
    description: "Verify a user without any of the safeguards"
  })
  async forceVerify(
    @SlashOption({
      name: "user",
      description: "The user to force verify",
      type: ApplicationCommandOptionType.User,
      required: true,
    })
    user: GuildMember,
    @SlashOption({
      name: "invited-by",
      description: "User who invited this member to this server.",
      type: ApplicationCommandOptionType.User,
      required: true,
    })
    inviter: GuildMember,
    @SlashOption({
      name: "permanent-server-invite",
      description: "A *permanent* invite to the server this member owns.",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    serverInvite: string,
    @SlashOption({
      name: "reason",
      description: "The reason for which you're force-verifying this user.",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    reason: string,
    @SlashOption({
      name: "share-invite-link",
      description: "Whether their server invite link should be shared.",
      type: ApplicationCommandOptionType.Boolean,
      required: true,
    })
    shareInvite: boolean,
    interaction: CommandInteraction,
  ): Promise<void> {
    if (!interaction.inGuild()) {
      throw new Error("Command must be used within a guild!");
    }

    const guild = await DbUtils.getGuild(interaction.guildId);
    const { verifiedRole, serversChannel } = guild;
    const invite = await interaction.client.fetchInvite(serverInvite);
    const inviteGuild = invite.guild as InviteGuild;
    const { name: guildName } = inviteGuild;
    const serverInfoChannel = await interaction.guild?.channels.fetch(serversChannel) as TextChannel;

    if (user.nickname?.includes(guildName)) {
      return await InteractionUtils.replyOrFollowUp(interaction, {
        content: "User is already verified for that club!",
        ephemeral: true,
      });
    }

    await user.roles.add(verifiedRole);
    if (user.nickname) {
      await user.setNickname(`${user.nickname.slice(0, user.nickname.length - 1)}, ${guildName})`);
    } else {
      await user.setNickname(`${user.displayName} (${guildName})`);
    }

    // Send server info to appropriate channel (if another owner hasn't already)
    if (shareInvite) {
      await serverInfoChannel.send({
        content: invite.url,
      });
    }
    await this._logger.warn(interaction, CommandActions.ForceVerify, reason, `\n**User Force Verified:** ${GuildUtils.safeMention(user)}\n**Inviter:** ${inviter}`);
    return await InteractionUtils.replyOrFollowUp(interaction, {
      content: "The user has been force verified.",
      ephemeral: true,
    });
  }

  private async verifySuccess(interaction: CommandInteraction, member: GuildMember, verifiedRoleId: string, guildName: string) {
    const rules = interaction.guild?.rulesChannel!;
    await member.roles.add(verifiedRoleId);
    if (member.nickname) {
      await member.setNickname(`${member.nickname.slice(0, member.nickname.length - 1)}, ${guildName})`);
    } else {
      await member.setNickname(`${member.displayName} (${guildName})`);
    }
    return await InteractionUtils.replyOrFollowUp(interaction, {
      content: `You have been verified. If you haven't already done so, please read the ${rules}.`,
      ephemeral: true,
    });
  }
}
