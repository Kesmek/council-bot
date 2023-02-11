import type { ArgsOf, Client } from "discordx";
import { Discord, On } from "discordx";
import { OnReady } from "./OnReady.js";
import { injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";

@Discord()
@injectable()
export class GuildCreate {
  public constructor(
    private _onReady: OnReady,
    private _prisma: PrismaClient,
  ) {
  }

  @On({ event: "guildCreate" })
  private async botJoined(
    [guild]: ArgsOf<"guildCreate">,
    client: Client,
  ) {
    console.log("Bot Joined:", guild.name);
    await this._prisma.guild.create({
      data: {
        id: guild.id,
      },
    });
    await this._onReady.initAppCommands(client);
  }

  @On({ event: "guildDelete" })
  private async botLeft([guild]: ArgsOf<"guildDelete">) {
    console.log("Bot Left:", guild.name);
    await this._prisma.guild.delete({
      where: {
        id: guild.id,
      },
    });
  }
}
