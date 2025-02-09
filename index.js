require("dotenv").config();
require("./src/Helpers/Extenders/Guild");

const { initializeMongoose } = require("./src/Data/connect");

initializeMongoose()

const BotClient = require("./src/Structures/BotClient");
const client = new BotClient()

client.loadCommands("src/Commands");
client.loadEvents("src/Events");
client.login(process.env.TOKEN);

module.exports = client