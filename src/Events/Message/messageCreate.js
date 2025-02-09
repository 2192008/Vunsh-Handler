const { ChannelType } = require("discord.js");
const { prefix_commands } = require("../../Data/Json/config.json");
const { prefixRun } = require("../../Handlers/Command");

module.exports = async (client, message) => {

    if(message.author?.bot) return;
    if (message.channel.type === ChannelType.DM) return;

    let isCommand = false;
    const prefix = prefix_commands.default_prefix.prefix
    if (prefix_commands.enabled) {
        if (message.content.includes(`${client.user.id}`)) {
            message.channel.send(`> My prefix is \`${prefix}\``);
        }

        if (message.content && message.content.startsWith(prefix)) {
            const invoke = message.content.replace(`${settings.prefix}`, "").split(/\s+/)[0];
            const cmd = client.getCommand(invoke);
            if (cmd) {
                isCommand = true;
                await prefixRun(message, cmd, settings)
            }
        }
    }

};