const neo4j = require("neo4j-driver");
const { URI, user, password } = require("../config.json");

let driver;

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
  async function mergeGuildQuery(arrayQStr){
    let session = driver.session({database:"neo4j"})
    await session.run(`WITH [${arrayQStr}] AS gIDs FOREACH ( element IN gIDs | MERGE (g:Guild{gID:element}) MERGE (g)-[:hasSetting]->(s:Setting) ON CREATE SET s.timeOut=duration({hours:1}))`)
    await session.close()
  }
  async function deleteGuildAndContentQuery(gID){
    let session = driver.session({database:"neo4j"})
    await session.run(`MATCH (g:Guild{gID:"${gID}"})--(s:Setting) MATCH (g)--(u:User)--(r:URL) DETACH DELETE g DETACH DELETE u DETACH DELETE r DELETE s`)
    await session.close()
  }
  async function findLinkThenMergeOrDeleteQuery(urls,gID,userID){
    let session = driver.session({database:'neo4j'})
    //the set was used to avoid duplicate URL in a single message to trigger the bot
    let urlSet = new Set();
    let returnStr = [];
    //TODO: look into this for help https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
    await Promise.all(urls.map( async element => {
      let url = element[0];
      if(urlSet.has(url)) return;
      urlSet.add(url);

      const searchRes = await session.run(`CALL db.index.fulltext.queryNodes("URLIndex",'"${url}"') YIELD node with node WHERE (:Guild{gID:"${gID}"})-[:hasUser]->()-[:posted]->(node) return node`)
    
      if(searchRes.records.length == 0){
        await session.run(`MERGE (g:Guild{gID:"${gID}"}) MERGE(u:User{uID:"${userID}"}) MERGE (g)-[:hasUser]->(u) MERGE (url:URL{body:"${url}"}) set url.datePosted = date() MERGE (u)-[:posted]->(url)`)
      }
      else{
        let id = searchRes.records.map((row) => {
          return row.get("node").identity.low;
        });
        await session.run(`match (u:URL) where ID(u) = ${id} detach delete u`);
        await deleteHangingUser(session);
        returnStr.push(url);
      }
    }));
    await session.close();
    return returnStr;
  }

  async function deleteHangingUser(session){
    let query = `MATCH (n:User) WHERE NOT (n)-->() detach delete n`;
    await session.run(query);
  }

  module.exports={
    mergeGuildQuery,deleteGuildAndContentQuery,findLinkThenMergeOrDeleteQuery
  }