const neo4j = require("neo4j-driver");
const { URI, user, password } = require("../config.json");
const SetTimeout = require("../commands/Admin/SetTimeout");

let driver;

const SECOND = BigInt(1000);
const DAY = BigInt(86400000);
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
async function mergeGuildQuery(arrayQStr) {
  let session = driver.session({ database: "neo4j" });
  await session.run(
    `WITH [${arrayQStr}] AS gIDs FOREACH ( element IN gIDs | MERGE (g:Guild{gID:element}) MERGE (g)-[:hasSetting]->(s:Setting) ON CREATE SET s.timeOut=duration({hours:1}))`
  );
  await session.close();
}
async function deleteGuildAndContentQuery(gID) {
  let session = driver.session({ database: "neo4j" });
  await session.run(
    `MATCH (g:Guild{gID:"${gID}"})--(s:Setting) MATCH (g)--(u:User)--(r:URL) DETACH DELETE g DETACH DELETE u DETACH DELETE r DELETE s`
  );
  await session.close();
}
async function findLinkThenMergeOrDeleteQuery(urls, gID, userID) {
  //the set was used to avoid duplicate URL in a single message to trigger the bot
  let urlSet = new Set();
  let returnStr = [];

  await Promise.all(
    urls.map(async (element) => {
      let url = element[0];
      if (urlSet.has(url)) return;
      urlSet.add(url);

      let session = driver.session({ database: "neo4j" });

      const searchRes = await session.run(
        `CALL db.index.fulltext.queryNodes("URLIndex",'"${url}"')
         YIELD node with node WHERE (:Guild{gID:"${gID}"})-[:hasUser]->()-[:posted]->(node)
         return elementId(node) as id`
      );
      if (searchRes.records.length == 0) {
        await session.run(
          `MERGE(u:User {uID:"${userID}"})
           MERGE (g:Guild {gID: "${gID}"}) 
           MERGE (g)-[:hasUser]->(u)
           CREATE (url:URL{body:'${url}'}) set url.datePosted = datetime() CREATE (u)-[:posted]->(url) WITH *
           MATCH (g)--(se:Setting)
           CALL apoc.periodic.submit(
             "${gID+userID+url}",
             "MATCH (g:Guild{gID: '${gID}'})--(s:Setting)
             CALL apoc.util.sleep(s.timeOut.Days*86400000+s.timeOut.Seconds*1000)
             MERGE (u:User{uID:'${userID}'}) WITH u
             MATCH (g)--(u)--(url:URL{body:'${url}'})
             DETACH DELETE url
             WITH g MATCH (g)--(n:User) WHERE NOT (n)-->() detach delete n
            ")
            YIELD name return name`
        )
      } else {
        let id = searchRes.records[0]._fields[0];
        await session.run(
          `match (u:URL) where elementId(u) = "${id}" 
           CALL apoc.periodic.cancel("${gID+userID+url}") YIELD name detach delete u 
          `);

        await deleteHangingUser(session,gID);

        returnStr.push(url);
      }
      session.close();
    })
  );

  return returnStr;
}
async function updateTimeOutSettingDuration(changes, guild) {
  let session = driver.session({ database: "neo4j" });
  await session.run(
    `MATCH (:Guild{gID:"${guild}"})--(s:Setting) SET s.timeOut = duration({days:${changes.day},hours:${changes.hour}})`
  );
  await session.close();
}

async function deleteHangingUser(session,gID) {
  await session.run(`MATCH (:Guild{gID:"${gID}"})--(n:User) WHERE NOT (n)-->() detach delete n`);
}

async function deleteDueURLQuery(res,gID){
  let session = driver.session({ database: "neo4j" });
  await session.run(
    `MATCH (g:Guild{gID:"${gID}"})--(u:User)--(url:URL)
     WHERE datetime()+duration.between(url.datePosted,datetime())>datetime()+duration({days:${res.day},hours:${res.hour}})
     with g,u,url
    CALL apoc.periodic.cancel(g.gID+u.uID+url.body) YIELD name detach delete u 
    `
  );
  await session.close();
}
//todo: cancel in arrays
async function updateBackgroundJobsQuery(gID){
  let session = driver.session({ database: "neo4j" });
  await session.run(
    `Match paths=(g:Guild{gID:"${gID}"})--(u:User)--(url:URL) with g.gID+u.uID+url.body as jobIDs
     UNWIND jobIDs as jobID CALL apoc.periodic.cancel(jobID) YIELD name
           CALL apoc.periodic.submit(
             name,
             "MATCH (g:Guild{gID: '${gID}'})--(s:Setting)
	            MATCH (g)--(u:User)--(url:URL)
  	          with duration.between(datetime(), url.datePosted+s.timeOut) as d
  	          CALL apoc.util.sleep(d.Days*86400000+d.Seconds*1000)
  	          MATCH (g)--(u)--(url:URL)
  	          DETACH DELETE url
  	          WITH g,u WHERE NOT (u)-->() detach delete u
            ")
       YIELD name as secondName return secondName`
  );
  await session.close();
}
module.exports = {
  mergeGuildQuery,
  deleteGuildAndContentQuery,
  findLinkThenMergeOrDeleteQuery,
  updateTimeOutSettingDuration,
  deleteDueURLQuery,
  updateBackgroundJobsQuery
};
