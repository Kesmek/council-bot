import "reflect-metadata";
import { container } from "tsyringe";
import dotenv from "dotenv";
import { dirname, importx } from "@discordx/importer";
import {
  Client,
  ClientOptions,
  DIService,
  tsyringeDependencyRegistryEngine,
} from "discordx";
import { PrismaClient } from "@prisma/client";
import { IntentsBitField } from "discord.js";

export class Main {
  public static start = async () => {
    dotenv.config();
    DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);
    const clientOps: ClientOptions = {
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
      ],
      silent: false,
    };
    // if (this.environment === "development") {
    clientOps["botGuilds"] = [
      (client: Client) => client.guilds.cache.map((guild) => guild.id),
    ];
    // }
    const bot = new Client(clientOps);

    if (!container.isRegistered(Client)) {
      container.registerInstance(Client, bot);
    }
    container.registerInstance(PrismaClient, new PrismaClient());

    // The following syntax should be used in the ECMAScript environment
    await importx(dirname(import.meta.url) + "/{events,commands}/**/*.{ts,js}");

    // Log in with your bot token
    await bot.login(process.env.BOT_TOKEN!);
  };
}

try {
  await Main.start();
} catch (e) {
  console.error(e);
} finally {
  container.resolve(PrismaClient)
  .$disconnect();
}
