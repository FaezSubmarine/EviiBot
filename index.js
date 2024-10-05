const neo4j = require("neo4j-driver");
const { Client,Collection, Events, GatewayIntentBits } = require("discord.js");
const { token, URI, user, password } = require("./config.json");

const fs = require('node:fs');
const path = require('node:path');

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

let driver
const day = 86400 * 1000;
(async () => {
  try {
    driver = neo4j.driver(URI, neo4j.auth.basic(user, password));
    const serverInfo = await driver.getServerInfo();
    console.log("Connection established");
    console.log(serverInfo);
  } catch (err) {
    console.log(`Connection error\n${err}\nCause: ${err.cause}`);
  }
})();
const queryEnum = {
  search: Symbol("search"),
  merge: Symbol("merge"),
  delete: Symbol("delete"),
};

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

client.once(Events.ClientReady, async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);

  const guilds = client.guilds.cache.map(guild => guild.id);
  console.log(guilds);

  let session = driver.session({ database: 'neo4j' })
  await mergeGuild(guilds,session);
  await session.close();

  // const noOfDays = 7;
  // //TODO: assign the interval to a map
  // var interval = setInterval(async () => {
  //   let session = driver.session({ database: 'neo4j' })
  //   await deleteURLByDate(noOfDays, session);
  //   await deleteHangingUser(session);
  //   await session.close();
  // }, day * noOfDays);
});

client.once(Events.GuildCreate, async (g) => {

  let session = driver.session({ database: 'neo4j' })
  console.log("joined a guild with an ID:"+g)
  await mergeGuild([g.id],session);
  await session.close();
});
client.once(Events.GuildDelete, async (g) => {

  let session = driver.session({ database: 'neo4j' })
  console.log("left a guild with an ID:"+g)
  query = `MATCH (g:Guild{gID:"${g.id}"})--(s:Setting) MATCH (g)--(u:User)--(r:URL) DETACH DELETE g DETACH DELETE u DETACH DELETE r DELETE s`;
  await session.run(query);
  await session.close();
});
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  let res = findLink(message.content);
  if (res == null) return;

  querying(res, message);
});

client.on(Events.InteractionCreate, async (interaction)=>{
  console.log("interaction");
  if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.log(`No command matching ${interaction.commandName} was found.`);
		return;
	}
  try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
})

async function deleteURLByDate(noOfDays, session) {
  let query = `MATCH (u:URL) where duration.inDays(u.datePosted,date()).days>=${noOfDays} detach delete u`;

  await session.run(query);
}
async function deleteHangingUser(session) {
  let query = `MATCH (n:User) WHERE NOT (n)-->() detach delete n`;
  await session.run(query);
  // query = `MATCH (n:Guild) WHERE NOT (n)-->() detach delete n`;
  // await session.run(query);
}

async function mergeGuild(gID,session){
  let arrayQStr = `'${gID.join('\',\'')}'`;
  console.log(arrayQStr)
  const query = `WITH [${arrayQStr}] AS gIDs FOREACH ( element IN gIDs | MERGE (g:Guild{gID:element}) MERGE (g)-[:hasSetting]->(s:Setting) ON CREATE SET s.timeOut=duration({hours:1}))`
  await session.run(query);
}
function findLink(msg) {
  let output = [];
  let m;
  while ((m = regex.exec(msg)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    output.push(m);
  }
  return output;
}


async function querying(res, message) {
  let resSet = new Set();
  try {
    res.forEach(async (eachRes) => {
      let url = eachRes[0];
      if (resSet.has(url)) return;
      resSet.add(url);

      let session = driver.session({ database: 'neo4j' })

      let query = queryBuilder(
        message.guildId,
        message.author.id,
        url,
        queryEnum.search
      );
      const searchRes = await session.run(query);
      if (searchRes.records.length == 0) {
        console.log("merge");
        query = queryBuilder(
          message.guildId,
          message.author.id,
          url,
          queryEnum.merge
        );
        await session.run(query);
      } else {
        console.log("delete");
        message.channel.send(
          "HEY GUYS CHECK OUT THIS BRAND NEW LINK I FOUND! " + url
        );
        let id = searchRes.records.map((row) => {
          return row.get("node").identity.low;
        });
        query = `match (u:URL) where ID(u) = ${id} detach delete u`;
        //console.log(query);
        await session.run(query);
        await deleteHangingUser(session);
        await session.close();
      }
    });
  } catch (e) {
    console.log(e);
  }
}

function queryBuilder(gID, userID, url, _queryEnum) {
  switch (_queryEnum) {
    case queryEnum.search:
      return `CALL db.index.fulltext.queryNodes("URLIndex",'"${url}"') YIELD node with node WHERE (:Guild{gID:"${gID}"})-[:hasUser]->()-[:posted]->(node) return node`;
    case queryEnum.merge:
      return `MERGE (g:Guild{gID:"${gID}"}) MERGE(u:User{uID:"${userID}"}) MERGE (g)-[:hasUser]->(u) MERGE (url:URL{body:"${url}"}) set url.datePosted = date() MERGE (u)-[:posted]->(url)`;
  }
  return "";
}

client.login(token);
//https://regex101.com/r/rkwdPr/1

module.exports.findLink = findLink;
module.exports.queryBuilder = queryBuilder;