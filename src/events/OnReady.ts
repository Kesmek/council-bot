import type { ArgsOf, Client } from "discordx";
import { Discord, On, Once } from "discordx";
import { injectable } from "tsyringe";
import { InteractionUtils } from "../utils/Utils.js";
import { PrismaClient } from "@prisma/client";

@Discord()
@injectable()
export class OnReady {
  public constructor(private _prisma: PrismaClient) {
  }

  public async initAppCommands(client: Client): Promise<void> {
    await client.initGlobalApplicationCommands();
    return await client.initApplicationCommands();
  }

  @Once({ event: "ready" })
  private async initialize([client]: [Client]) {
    await this.initAppCommands(client);
    for (const guildId of client.guilds.cache.keys()) {
      // noinspection TypeScriptValidateJSTypes
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
  private async intersectionInit(
    [interaction]: ArgsOf<"interactionCreate">,
    client: Client,
  ): Promise<void> {
    try {
      await client.executeInteraction(interaction);
    } catch (e) {
      let error = e as Error & {
        code: number;
      };
      console.error(e);
      if (interaction.isCommand() ||
        interaction.isMessageComponent()) {
        if (error.code === 50013) {
          return InteractionUtils.replyOrFollowUp(
            interaction,
            {
              content: `This bot is missing the appropriate permissions to perform this action.` +
                ` Double check it's permissions and make sure it is positioned near` +
                ` the top of the role hierarchy.`,
              ephemeral: true,
            },
          );
        } else if (error.code === 50001) {
          return InteractionUtils.replyOrFollowUp(interaction, {
            content: `This bot is missing the appropriate permissions to view or send ` +
              `messages to the relevant channel. Double check that the bot has ` +
              `permission to view and send messages in the relevant channels (` +
              `alongside any other necessary permissions)`,
            ephemeral: true,
          });
        }
        return InteractionUtils.replyOrFollowUp(
          interaction,
          {
            content: `Oops, something went wrong. The best way to report this problem is to contact` +
              ` the bot creator <@211505087653085184> (Kesmek#0001). Some helpful information` +
              ` to provide to them: \`\`\`\nname: ${error.name}\n` +
              `message: ${error.message}${error?.code
                ? `\ncode: ${error.code}`
                : ""}\`\`\`\n Couple this with context to ensure the bug is quickly squashed.`,
            ephemeral: true,
          },
        );
      }
    }
  }
}
