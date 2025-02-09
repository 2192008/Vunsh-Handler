const { EmbedBuilder } = require("discord.js");
const { logUrgent } = require("../Helpers/Logger");
const colors = require("../Data/Json/colors.json")
const emojis = require("../Data/Json/emojis.json")
const { id } = require("../Helpers/Functions/ID");

async function handlerError(message, error) {
    const code = id(6)
    const response = new EmbedBuilder()
        .setDescription(`${emojis.no} \`${error.message}\`\n**Error Code:** \`${code}}\``)
        .setColor(colors.pink)
    logUrgent(`! [Error] ${code}`)
    console.log(error.stack)
    return message.channel.send({ embeds: [response] }).catch(() => { })
}

module.exports = { handlerError }