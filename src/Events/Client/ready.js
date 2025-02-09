const { ActivityType } = require('discord.js');
const { logGood, logInfo } = require('../../Helpers/Logger');
const config = require('../../Data/Json/config.json');
const ms = require("ms");

module.exports = async (client) => {

  logGood(`[Client] ${client.user.tag} is ready! Watching ${client.guilds.cache.size} Server(s)`);
  const up = ms(ms(Math.round(process.uptime() - (client.uptime / 1000)) + ' seconds'));
  logInfo(`[Node] Took ${up} to load & connect.`);

  setInterval(() => {

    const statuses = config.status.statuses

    const status = statuses[Math.floor(Math.random() * statuses.length)]
    client.user.setActivity(status.replace("{prefix}", config.prefix_commands.default_prefix), { type: ActivityType.Competing })

  }, config.status.display_time * 1000)

  client.registerInteractions()

}