const neo4j = require("neo4j-driver");
const { URI, user, password } = require("../config.json");

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
    `WITH [$arrayQStr] AS gIDs
     FOREACH ( element IN gIDs | MERGE (g:Guild{gID:element})
      MERGE (g)-[:hasSetting]->(s:Setting)
      ON CREATE SET s.timeOut=duration({hours:1}) ON CREATE SET s.mode = 0 ON CREATE SET s.deleteAfterRepost = TRUE
     )`,{arrayQStr:arrayQStr}
  );
  await session.close();
}
async function deleteGuildAndContentQuery(gID) {
  let session = driver.session({ database: "neo4j" });
  await session.run(
    `MATCH (g:Guild{gID:$gID})--(s:Setting) MATCH (g)--(u:User)--(r:URL) DETACH DELETE g DETACH DELETE u DETACH DELETE r DELETE s`
    ,{gID:gID});
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
        `CALL db.index.fulltext.queryNodes("URLIndex",'$url')
         YIELD node with node WHERE (:Guild{gID:$gID})-[:hasUser]->()-[:posted]->(node)
         return elementId(node) as id`,{url:url,gID:gID}
      );
      if (searchRes.records.length == 0) {
        await session.run(
          `MERGE(u:User {uID:$userID})
           MERGE (g:Guild {gID: $gID}) 
           MERGE (g)-[:hasUser]->(u)
           CREATE (url:URL{body:$url}) set url.datePosted = datetime() CREATE (u)-[:posted]->(url) WITH *
           MATCH (g)--(se:Setting)
           CALL apoc.periodic.submit(
             $procName,
             "MATCH (g:Guild{gID: $gID})--(s:Setting)
             CALL apoc.util.sleep(s.timeOut.Days*86400000+s.timeOut.Seconds*1000)
             MERGE (u:User{uID:$userID}) WITH u
             MATCH (g)--(u)--(url:URL{body:$url})
             DETACH DELETE url
             WITH g MATCH (g)--(n:User) WHERE NOT (n)-->() detach delete n
            ")
            YIELD name return name`
        ,{userID:userID,gID:gID,procName:gID+userID+url,url:url})
      } else {
        let id = searchRes.records[0]._fields[0];
        let user = await session.run(`match (u:URL)<--(user:User)<--(:Guild)-->(s:Setting) where elementId(u) = $id 
                                      return user.uID as user,s.deleteAfterRepost as setting`,{id:id})
                                      
        if(user.records[0]._fields[1]==true){
          await session.run(`match (url:URL)<--(u:User)<--(g:Guild) where elementId(url) = $id
            CALL apoc.periodic.cancel(g.gID+u.uID+url.body) YIELD name detach delete url
           ") YIELD value
           MATCH (:Guild{gID:$gID})--(n:User) WHERE NOT (n)-->() detach delete n
            return user.uID`,{id:id,gID:gID});
        }
        returnStr.push({_url:url,_user:user.records[0]._fields[0]});
      }
      session.close();
    })
  );

  return returnStr;
}
async function updateTimeOutSettingDuration(changes, guild) {
  let session = driver.session({ database: "neo4j" });
  await session.run(
    `MATCH (:Guild{gID:"$guild"})--(s:Setting) 
    SET s.timeOut = duration({days:$day,hours:$hour)`,
    {guild:guild,day:changes.day,hour:changes.hour});
  await session.close();
}
async function updateBackgroundJobsQuery(gID){
  let session = driver.session({ database: "neo4j" });
  await session.run(
    `Match paths=(g:Guild{gID:$gID)--(u:User)--(url:URL) with g.gID+u.uID+url.body as jobIDs
     UNWIND jobIDs as jobID CALL apoc.periodic.cancel(jobID) YIELD name
           CALL apoc.periodic.submit(
             name,
             "MATCH (g:Guild{gID: $gID})--(s:Setting)
	            MATCH (g)--(u:User)--(url:URL)
  	          with duration.between(datetime(), url.datePosted+s.timeOut) as d
  	          CALL apoc.util.sleep(d.Days*86400000+d.Seconds*1000)
  	          MATCH (g)--(u)--(url:URL)
  	          DETACH DELETE url
  	          WITH g,u WHERE NOT (u)-->() detach delete u
            ")
       YIELD name as secondName return secondName`,{gID:gID}
  );
  await session.close();
}

async function checkModeOfEachGuildQuery(gID){
  let session = driver.session({ database: "neo4j" });
  let res = await session.run(`MATCH (g:Guild{gID:$gID})--(s:Setting) return s.mode`,{gID:gID})
  await session.close();
  return res.records[0]._fields[0].low;
}

async function ChangeModeQuery(gID,mode){
  let session = driver.session({ database: "neo4j" });
  await session.run(`MATCH (g:Guild{gID:$gID})--(s:Setting) SET  s.mode = $mode`,{gID:gID,mode:mode})
  await session.close();
}

async function GetURLsQuery(gID){
  let session = driver.session({ database: "neo4j" });
  let res = await session.run(`MATCH (g:Guild{gID:$gID})--(u:User)--(url:URL) return u.uID,url.body`,{gID:gID})
  await session.close();
  return res.records;
}

async function getSettingPropertiesQuery(gID){
  let session = driver.session({ database: "neo4j" });
  let res = await session.run(
    `MATCH (g:Guild{gID:$gID})--(s:Setting) return properties(s)`,{gID:gID})
  await session.close();
  return res.records[0]._fields[0];
}

async function ToggleURLForgetfulnessQuery(gID){
  let session = driver.session({ database: "neo4j" });
  let res = await session.run(
    `MATCH (:Guild{gID:$gID})--(s:Setting) 
    SET s.deleteAfterRepost= NOT s.deleteAfterRepost 
    return s.deleteAfterRepost as repostBool`,{gID:gID})
  await session.close();
  return res.records[0]._fields[0];
}
module.exports = {
  mergeGuildQuery,
  deleteGuildAndContentQuery,
  findLinkThenMergeOrDeleteQuery,
  updateTimeOutSettingDuration,
  updateBackgroundJobsQuery,
  checkModeOfEachGuildQuery,
  ChangeModeQuery,
  GetURLsQuery,
  getSettingPropertiesQuery,
  ToggleURLForgetfulnessQuery
};
