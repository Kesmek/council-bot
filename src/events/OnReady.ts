import type { ArgsOf, Client } from "discordx";
import { Discord, On, Once } from "discordx";
import { injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import { BotCreator } from "../utils/Constants.js";
import { ChannelType, InteractionType, PermissionsBitField } from "discord.js";
import { InteractionUtils } from "../utils/Utils.js";

@Discord()
@injectable()
export class OnReady {
  public constructor(private _prisma: PrismaClient) { }

  public async initAppCommands(client: Client): Promise<void> {
    return await client.initApplicationCommands();
  }

  @Once({ event: "ready" })
  private async initialize([client]: [Client]): Promise<void> {
    await this.initAppCommands(client);
    for (const guildId of client.guilds.cache.keys()) {
      await this._prisma.guild.upsert({
        where: {
          id: guildId,
        },
        create: {
          id: guildId,
        },
        update: {
          id: guildId,
        },
      });
    }
  };

  @On({ event: "interactionCreate" })
  private async interactionCreate(
    [interaction]: ArgsOf<"interactionCreate">,
    client: Client,
  ): Promise<void> {
    try {
      await client.executeInteraction(interaction);
    } catch (e) {
      if (e instanceof Error) {
        console.error(e.message);
      } else {
        console.error(e);
      }

      const me = interaction?.guild?.members?.me ?? interaction.user;
      if (interaction.type === InteractionType.ApplicationCommand || interaction.type === InteractionType.MessageComponent) {
        const channel = interaction.channel;
        if (channel && (channel.type !== ChannelType.GuildText || !channel.permissionsFor(me)?.has(PermissionsBitField.Flags.SendMessages))) {
          console.error(`cannot send warning message to this channel`, interaction);
          return;
        }
        try {
          await InteractionUtils.replyOrFollowUp(
            interaction,
            {
              content: `Something went wrong, please notify my developer: ${BotCreator}`,
              ephemeral: true,
            }
          );
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
}
