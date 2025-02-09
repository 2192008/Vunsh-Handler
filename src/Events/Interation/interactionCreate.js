const { slashRun } = require("../../Handlers/Command");
const config = require("../../Data/Json/config.json")
module.exports = async (client, interaction) => {
  if (!interaction.guild) return;
  if (interaction.isChatInputCommand()) await slashRun(client, interaction);

  if (interaction.isButton()) {
    const customId = interaction.customId;

    if (customId.startsWith('refresh_')) {
      
      if (!config.auth.includes(interaction.user.id)) {
        return await interaction.reply({ content: 'You can not update this embed.', ephemeral: true });
    }

      const ids = customId.split('_');

      if (interaction.guild.id !== ids[2]) return console.log("no guild");
      const channel = await interaction.client.channels.fetch(ids[3]).catch(() => null);
      if (!channel) return console.log("no channel");

      const originalMessage = await channel.messages.fetch(ids[4]).catch(() => null);
      if (!originalMessage) return console.log("no message");

      const embed = await require(`../../Data/embeds/${ids[1]}.js`)(interaction.client, interaction.message);
      await originalMessage.edit({ embeds: [embed] });

      await interaction.reply({ content: 'Embed refreshed!', ephemeral: true });
    }
  }


  if (interaction.type === InteractionType.ModalSubmit) {
    switch (interaction.customId) {

    }
  }

};