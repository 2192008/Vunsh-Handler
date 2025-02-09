const { Client, GatewayIntentBits, Partials, Collection, ApplicationCommandType } = require('discord.js');
const config = require('../Data/Json/config.json');
const { recursiveReadDirSync } = require('../Helpers/Utils');
const path = require('path');
const Logger = require('../Helpers/Logger');

module.exports = class BotClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [
        Partials.Message,
        Partials.Reaction,
        Partials.User,
      ],
      ws: {
        properties: {
          browser: 'Discord iOS',
        },
      },
    });

    this.wait = require("node:timers/promises").setTimeout
    this.colors = require("../Data/Json/colors.json")
    this.config = config;

    this.commands = [];
    this.commandIndex = new Collection();
    this.slashCommands = new Collection();

    this.logger = Logger;

  }

  loadEvents(directory) {
    this.logger.log(`Loading events...`);
    let success = 0;
    let failed = 0;
    const clientEvents = [];

    recursiveReadDirSync(directory).forEach((filePath) => {
      const file = path.basename(filePath);
      try {
        const eventName = path.basename(file, ".js");
        const event = require(filePath);

        this.on(eventName, event.bind(null, this));
        clientEvents.push([file, "✓"]);

        delete require.cache[require.resolve(filePath)];
        success += 1;
      } catch (ex) {
        failed += 1;
        this.logger.logUrgent(`loadEvent - ${file}`, ex.stack);
      }
    });

    this.logger.log(`Loaded ${success + failed} events. Success (${success}) Failed (${failed})`);
  }

  getCommand(invoke) {
    const index = this.commandIndex.get(invoke.toLowerCase());
    return index !== undefined ? this.commands[index] : undefined;
  }

  loadCommand(cmd) {
    if (cmd.prefix?.enabled) {
      const index = this.commands.length;
      if (this.commandIndex.has(cmd.name)) {
        throw new Error(`Command ${cmd.name} already registered`);
      }
      if (Array.isArray(cmd.prefix.aliases)) {
        cmd.prefix.aliases.forEach((alias) => {
          if (this.commandIndex.has(alias)) throw new Error(`Alias ${alias} already registered`);
          this.commandIndex.set(alias.toLowerCase(), index);
        });
      }
      this.commandIndex.set(cmd.name.toLowerCase(), index);
      this.commands.push(cmd);
    }

    if (cmd.slash?.enabled) {
      if (this.slashCommands.has(cmd.name)) throw new Error(`Slash Command ${cmd.name} already registered`);
      this.slashCommands.set(cmd.name, cmd);
    }
  }

  loadCommands(directory) {
    this.logger.log(`Loading commands...`);
    const files = recursiveReadDirSync(directory);
    for (const file of files) {
      try {
        const cmd = require(file);
        if (typeof cmd !== "object") continue;
        this.loadCommand(cmd);
      } catch (ex) {
        this.logger.logUrgent(`Failed to load ${file} Reason: ${ex.message}`);
      }
    }

    this.logger.logGood(`Loaded ${this.commands.length} commands`);
    this.logger.logGood(`Loaded ${this.slashCommands.size} slash commands`);
    if (this.slashCommands.size > 100) throw new Error("A maximum of 100 slash commands can be enabled");
  }

  async registerInteractions() {
    const toRegister = [];

    this.slashCommands
      .map((cmd) => ({
        name: cmd.name,
        description: cmd.description,
        type: ApplicationCommandType.ChatInput,
        options: cmd.slash.options,
      }))
      .forEach((s) => toRegister.push(s));

    await this.application.commands.set(toRegister)

    this.logger.logGood("Successfully registered interactions");
  }

};