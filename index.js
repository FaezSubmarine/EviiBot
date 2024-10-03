const neo4j = require("neo4j-driver");
const { Client, Events, GatewayIntentBits } = require("discord.js");
const { token, URI, user, password } = require("./config.json");

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

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  const noOfDays = 7;
  var interval = setInterval(async () => {
    let session = driver.session({ database: 'neo4j' })
    await deleteURLByDate(noOfDays, session);
    await deleteHangingUser(session);
    await session.close();
  }, day * noOfDays);
});
async function deleteURLByDate(noOfDays, session) {
  let query = `MATCH (u:URL) where duration.inDays(u.datePosted,date()).days>=${noOfDays} detach delete u`;

  await session.run(query);
}
async function deleteHangingUser(session) {
  let query = `MATCH (n:User) WHERE NOT (n)-->() detach delete n`;
  await session.run(query);
  query = `MATCH (n:Guild) WHERE NOT (n)-->() detach delete n`;
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
client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  let res = findLink(message.content);
  if (res == null) return;

  querying(res, message);
});

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