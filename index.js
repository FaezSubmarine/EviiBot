const neo4j = require("neo4j-driver");
const { Client,Collection, Events, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");

const fs = require('node:fs');
const path = require('node:path');

//TODO: place this in the proper events page once those are made
const {mergeGuild, deleteGuildAndContent,findLink,assessLink} = require('./service/MessageService.js')
const regex =
  /(?:http[s]?:\/\/[www]?.)[A-Za-z0-9.-]+(?:\/[\+~%\/.\w_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*)/g;

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

async function deleteURLByDate(noOfDays, session) {
  let query = `MATCH (u:URL) where duration.inDays(u.datePosted,date()).days>=${noOfDays} detach delete u`;

  await session.run(query);
}
client.login(token);