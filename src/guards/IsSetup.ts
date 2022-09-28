import { GuardFunction } from "discordx";
import {
  CommandInteraction,
  UserContextMenuCommandInteraction,
} from "discord.js";
import { container } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import { InteractionUtils } from "../utils/Utils.js";

export const IsSetup: GuardFunction<CommandInteraction | UserContextMenuCommandInteraction> = async (
  arg,
  client,
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
    && guildInfo.minorBlacklistChannel
    && guildInfo.userBlacklistChannel
  ) {
    await next();
  } else {
    await InteractionUtils.replyOrFollowUp(arg, {
      content: "You must setup the bot first with `/setup`!",
      ephemeral: true,
    });
  }
};
