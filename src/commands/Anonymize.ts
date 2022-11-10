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
      content: string,
    @SlashOption({
      name: "attachment",
      description: "An attachment that you wish to anonymize",
      type: ApplicationCommandOptionType.Attachment,
      required: false,
    })
      attachment: Attachment,
    interaction: CommandInteraction,
  ) {
    const message = await channel.send({
      content,
      files: [attachment],
    });

    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`delete-${channel.id}-${message.id}`)
      .setLabel("Delete")
      .setStyle(ButtonStyle.Danger),
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
    const [suffix, channelId, messageId] = interaction.customId.split("-");

    const channel = await interaction.guild?.channels.fetch(channelId) as TextChannel;
    const message = await channel.messages.fetch(messageId);
    await message.delete();
    await interaction.reply({
      content: "Message deleted.",
      ephemeral: true,
    })
  }
}
