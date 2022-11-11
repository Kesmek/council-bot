import { ButtonComponent, Discord, Slash, SlashOption } from "discordx";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  Attachment,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  CommandInteraction,
  MessageActionRowComponentBuilder,
  TextChannel,
} from "discord.js";
import { InteractionUtils } from "../utils/Utils.js";

@Discord()
class Anonymize {
  @Slash({
    name: "anonymize",
    description: "Anonymize any text or attachments you pass to this command",
  })
  async anonymize(
    @SlashOption({
      name: "target-channel",
      description: "The channel which the anonymized message will be sent to",
      type: ApplicationCommandOptionType.Channel,
      channelTypes: [ChannelType.GuildText],
      required: true,
    })
      channel: TextChannel,
    @SlashOption({
      name: "content",
      description: "Text that you wish to anonymize",
      type: ApplicationCommandOptionType.String,
      required: false,
    })
      content: string | undefined,
    @SlashOption({
      name: "attachment-1",
      description: "An attachment that you wish to anonymize",
      type: ApplicationCommandOptionType.Attachment,
      required: false,
    })
      attachment1: Attachment | undefined,
    @SlashOption({
      name: "attachment-2",
      description: "A second attachment that you wish to anonymize",
      type: ApplicationCommandOptionType.Attachment,
      required: false,
    })
      attachment2: Attachment | undefined,
    @SlashOption({
      name: "attachment-3",
      description: "A third attachment that you wish to anonymize",
      type: ApplicationCommandOptionType.Attachment,
      required: false,
    })
      attachment3: Attachment | undefined,
    interaction: CommandInteraction,
  ) {
    const files = [];
    if (attachment1) {
      files.push(attachment1);
    }
    if (attachment2) {
      files.push(attachment2);
    }
    if (attachment3) {
      files.push(attachment3);
    }

    const message = await channel.send({
      content,
      files,
    });

    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`delete-${channel.id}-${message.id}`)
      .setLabel("Delete")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🗑"),
    );
    await interaction.reply({
      content: "Message has been sent. If this was a mistake or you'd like" +
        " to change the message or it's destination, press here to delete" +
        " the message.",
      components: [row],
      ephemeral: true,
    });
  }

  @ButtonComponent({ id: /delete-.*/ })
  async handler(interaction: ButtonInteraction): Promise<void> {
    const [, channelId, messageId] = interaction.customId.split("-");

    const channel = await interaction.guild?.channels.fetch(channelId) as TextChannel;
    // TODO: When deleting ephemeral messages is implemented, use that instead
    try {
      const message = await channel.messages.fetch(messageId);
      await message.delete();
      await interaction.reply({
        content: "Message deleted.",
        ephemeral: true,
      });
    } catch (e) {
      await InteractionUtils.replyOrFollowUp(interaction, {
        content: "Message has already been deleted! You can dismiss the" +
          " message with the delete button now.",
        ephemeral: true,
      });
    }
  }
}
