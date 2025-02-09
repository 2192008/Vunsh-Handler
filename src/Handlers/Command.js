const { EmbedBuilder } = require("discord.js");
const { developers } = require("../Data/Json/config.json");
const emojis = require("../Data/Json/emojis.json");
const cooldownCache = new Map();

module.exports = {
    prefixRun: async function (message, cmd, settings) {
        const prefix = settings.prefix;
        const { client } = message;
        const args = message.content.slice(prefix.length).trim().split(/ +/g);

        if (!message.channel.permissionsFor(message.guild.members.me).has("SendMessages")) return;

        if (cmd.developer === true && !developers.includes(message.author.id)) return;

        if (cmd.userPermissions && cmd.userPermissions.length > 0) {
            if (!message.channel.permissionsFor(message.member).has(cmd.userPermissions)) return;
        }

        if (cmd.botPermissions && cmd.botPermissions.length > 0) {
            if (!message.channel.permissionsFor(message.guild.members.me).has(cmd.botPermissions)) return;
        }

        if (cmd.cooldown > 0) {
            const remaining = getRemainingCooldown(message.author.id, cmd);
            if (remaining > 0) return;
        }

        try {
            message.emojis = emojis;
            client.config = require("../Data/Json/config.json");

            await cmd.prefixRun(client, message, args);
        } catch (ex) {
            console.log(ex);
            const embedError = new EmbedBuilder()
                .setDescription(`${emojis.error} ${message.member}: You have encountered an issue, please avoid trying to recreate`)
                .setTimestamp();

            return message.channel.send({ embeds: [embedError] }).catch(() => {});
        }
    },

    slashRun: async function (client, interaction) {
        const cmd = interaction.client.slashCommands.get(interaction.commandName);

        const embedCommandRemoved = new EmbedBuilder()
            .setDescription(`${emojis.no_grey} ${interaction.user}: This command has been removed by a developer.`)
            .setColor("#808080");
        if (!cmd.name) return interaction.reply({ embeds: [embedCommandRemoved], ephemeral: true }).catch(() => { });

        try {
            await interaction.deferReply({ ephemeral: cmd.slash.ephemeral });
            interaction.emojis = emojis;
            await cmd.slashRun(client, interaction);
        } catch (ex) {
            console.log(ex)
            return interaction.followUp({ embeds: [embedCommandRemoved], ephemeral: true }).catch(() => { });
        } finally {
            if (cmd.cooldown > 0) applyCooldown(interaction.user.id, cmd);
        }
    }
};

function applyCooldown(memberId, cmd) {
    const key = cmd.name + "|" + memberId;
    cooldownCache.set(key, Date.now());
}

function getRemainingCooldown(memberId, cmd) {
    const key = cmd.name + "|" + memberId;
    if (cooldownCache.has(key)) {
        const remaining = (Date.now() - cooldownCache.get(key)) * 0.001;
        if (remaining > cmd.cooldown) {
            cooldownCache.delete(key);
            return 0;
        }
        return cmd.cooldown - remaining;
    }
    return 0;
}
