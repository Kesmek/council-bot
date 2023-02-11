import { GuardFunction } from "discordx";
import {
  CommandInteraction,
  GuildMemberRoleManager,
  MessageComponentInteraction,
} from "discord.js";
import { container } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import { InteractionUtils } from "../utils/Utils.js";

export const IsSetup: GuardFunction<CommandInteraction | MessageComponentInteraction> = async (
  arg,
  _, // Client
  next,
) => {
  const _prisma = container.resolve(PrismaClient);
  const guildInfo = await _prisma.guild.findFirst({
    where: {
      id: arg.guildId ?? "",
    },
  });
  if (
    guildInfo?.moderationChannel
    && guildInfo.verifiedRole
    && guildInfo.blacklistChannel
    && guildInfo.serversChannel
  ) {
    await next();
  } else {
    await InteractionUtils.replyOrFollowUp(arg, {
      content: "You must setup the bot first with `/setup`!",
      ephemeral: true,
    });
  }
};

export const IsForumSetup: GuardFunction<CommandInteraction | MessageComponentInteraction> = async (
  arg,
  _, // Client
  next,
) => {
  const _prisma = container.resolve(PrismaClient);
  const guildInfo = await _prisma.guild.findFirst({
    where: {
      id: arg.guildId ?? "",
    },
  });
  if (
    guildInfo?.moderationChannel
    && guildInfo.verifiedRole
    && guildInfo.blacklistChannel
    && guildInfo.serversChannel
    && guildInfo.forumPendingTagId
    && guildInfo.forumValidTagId
    && guildInfo.forumInvalidTagId
  ) {
    await next();
  } else {
    await InteractionUtils.replyOrFollowUp(arg, {
      content: "You must setup the forums channel first with `/setup-forums`!",
      ephemeral: true,
    });
  }
};
