const { EmbedBuilder } = require("discord.js");
const emojis = require("../Data/Json/emojis.json");
const cooldownCache = new Map();

module.exports = {
    prefixRun: async function (message, cmd, settings) {
        const prefix = settings.prefix;
        const { client } = message;
        const args = message.content.slice(prefix.length).trim().split(/ +/g);

        if (!message.channel.permissionsFor(message.guild.members.me).has("SendMessages")) return;

        if (cmd.userPermissions && cmd.userPermissions.length > 0) {
            const missingUserPerms = cmd.userPermissions.filter(perm => 
                !message.channel.permissionsFor(message.member).has(perm)
            );

            if (missingUserPerms.length > 0) return;
        }

        if (cmd.botPermissions && cmd.botPermissions.length > 0) {
            const missingBotPerms = cmd.botPermissions.filter(perm => 
                !message.channel.permissionsFor(message.guild.members.me).has(perm)
            );

            if (missingBotPerms.length > 0) {
                const embed = new EmbedBuilder()
                    .setDescription(`${emojis.no_grey} ${message.author}: I do not have the proper permissions to execute this command: \`${missingBotPerms.join(", ")}\``)
                    .setColor("#808080");
                return message.channel.send({ embeds: [embed] }).catch(() => { });
            }
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
                .setDescription(`${emojis.error} ${message.member}: You have encountered an issue, please avoid trying to recreate.`)
                .setColor("#FF0000")
                .setTimestamp();

            return message.channel.send({ embeds: [embedError] }).catch(() => { });
        }
    },

    slashRun: async function (client, interaction) {
        const cmd = interaction.client.slashCommands.get(interaction.commandName);

        if (!cmd || !cmd.name) {
            const embedCommandRemoved = new EmbedBuilder()
                .setDescription(`${emojis.no_grey} ${interaction.user}: This command has been removed by a developer.`)
                .setColor("#808080");
            return interaction.reply({ embeds: [embedCommandRemoved], ephemeral: true }).catch(() => { });
        }

        try {
            if (cmd.userPermissions && cmd.userPermissions.length > 0) {
                const missingUserPerms = cmd.userPermissions.filter(perm => 
                    !interaction.channel.permissionsFor(interaction.member).has(perm)
                );

                if (missingUserPerms.length > 0) {
                    const embed = new EmbedBuilder()
                        .setDescription(`${emojis.no_grey} ${interaction.user}: You do not have the proper permissions to execute this command: \`${missingUserPerms.join(", ")}\``)
                        .setColor("#808080");
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }
            }

            if (cmd.botPermissions && cmd.botPermissions.length > 0) {
                const missingBotPerms = cmd.botPermissions.filter(perm => 
                    !interaction.channel.permissionsFor(interaction.guild.members.me).has(perm)
                );

                if (missingBotPerms.length > 0) {
                    const embed = new EmbedBuilder()
                        .setDescription(`${emojis.no_grey} ${interaction.user}: I do not have the proper permissions to execute this command: \`${missingBotPerms.join(", ")}\``)
                        .setColor("#808080");
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }
            }

            await interaction.deferReply({ ephemeral: cmd.slash.ephemeral });
            interaction.emojis = emojis;
            await cmd.slashRun(client, interaction);
        } catch (ex) {
            console.log(ex);
            const embedError = new EmbedBuilder()
                .setDescription(`${emojis.error} ${interaction.user}: An error occurred while executing this command.`)
                .setColor("#FF0000")
                .setTimestamp();
            return interaction.followUp({ embeds: [embedError], ephemeral: true }).catch(() => { });
        } finally {
            if (cmd.cooldown > 0) applyCooldown(interaction.user.id, cmd);
        }
    }
};

function applyCooldown(memberId, cmd) {
    const key = `${cmd.name}|${memberId}`;
    cooldownCache.set(key, Date.now());
}

function getRemainingCooldown(memberId, cmd) {
    const key = `${cmd.name}|${memberId}`;
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
