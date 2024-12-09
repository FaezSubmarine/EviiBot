const neo4j = require("neo4j-driver");
const URI = process.env.URI;
const user = process.env.USER;
const password = process.env.PASSWORD;
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
async function mergeGuildQuery(arrayQStr) {
  let session = driver.session({ database: "neo4j" });
  await session.run(
    `WITH $arrayQStr AS gIDs
     FOREACH ( element IN gIDs | MERGE (g:Guild{gID:element})
      MERGE (g)-[:hasSetting]->(s:Setting)
      ON CREATE SET s.timeOut=duration({hours:1}) ON CREATE SET s.mode = 0 ON CREATE SET s.deleteAfterRepost = TRUE
     )`,{arrayQStr:arrayQStr},{ database: "neo4j" }
  );
  await session.close();
}
async function deleteGuildAndContentQuery(gID) {
  let session = driver.session({ database: "neo4j" });
  await session.run(
    `MATCH (g:Guild{gID:$gID})--(s:Setting) MATCH (g)--(u:User)--(r:URL) DETACH DELETE g DETACH DELETE u DETACH DELETE r DELETE s`
    ,{gID:gID},{ database: "neo4j" });
  await session.close();
}
async function findLinkThenMergeOrDeleteQuery(urls, gID, userID) {
  //the set was used to avoid duplicate URL in a single message to trigger the bot
  let urlSet = new Set();
  let returnStr = [];

  await Promise.all(
    urls.map(async (element) => {
      let url = element[0];
      console.log(url);
      if (urlSet.has(url)) return;
      urlSet.add(url);

      let session = driver.session({ database: "neo4j" });

      const searchRes = await session.run(
        `MATCH (g:Guild)-->()-->(url:URL{body:$url}) where g.gID = $gID
         return elementId(url) as id`,{url:url,gID:gID},{ database: "neo4j" }
      );
      if (searchRes.records.length == 0) {
        await session.run(
          `WITH $userID as userID, $gID as gID,$url as url
           MERGE (g:Guild {gID: gID}) 
           MERGE (g)-[:hasUser]->(u:User {uID:userID})
           CREATE (urlNode:URL{body:url}) set urlNode.datePosted = datetime() 
           CREATE (u)-[:posted]->(urlNode) WITH *
           return g`
        ,{userID:userID,gID:gID,procName:gID+userID+url,url:url},{ database: "neo4j" })
      } else {
        let id = searchRes.records[0]._fields[0];
        let res = await session.run(`match (url:URL)<--(u:User)<--(g:Guild)-->(s:Setting) where elementId(url) = $id
                                      with u,CASE s.deleteAfterRepost WHEN true THEN url ELSE NULL end as urlRes
                                      DETACH DELETE urlRes with u,u.uID as uID MATCH (u) WHERE NOT (u)-->() detach delete u return uID`,{id:id},{ database: "neo4j" });
        
        returnStr.push({_url:url,_user:res.records[0]._fields[0]});
      }
      session.close();
    })
  );

  return returnStr;
}
async function updateTimeOutSettingDuration(changes, guild) {
  let session = driver.session({ database: "neo4j" });
  await session.run(
    `MATCH (:Guild{gID:$guild})--(s:Setting) 
    SET s.timeOut = duration({days:$day,hours:$hour})`,
    {guild:guild,day:changes.day,hour:changes.hour});
  await session.close();
}

async function checkModeOfEachGuildQuery(gID){
  let session = driver.session({ database: "neo4j" });
  let res = await session.run(`MATCH (g:Guild{gID:$gID})--(s:Setting) return s.mode`,{gID:gID},{ database: "neo4j" })
  await session.close();
  // returns 0 or 1
  // 0: Response Mode, 1: Delete Mode
  return res.records[0]._fields[0].low;
}

async function ChangeModeQuery(gID,mode){
  let session = driver.session({ database: "neo4j" });
  await session.run(`MATCH (g:Guild{gID:$gID})--(s:Setting) SET  s.mode = $mode`,{gID:gID,mode:mode},{ database: "neo4j" })
  await session.close();
}

async function GetURLsQuery(gID){
  let session = driver.session({ database: "neo4j" });
  let res = await session.run(`MATCH (g:Guild{gID:$gID})--(u:User)--(url:URL) return u.uID,url.body`,{gID:gID},{ database: "neo4j" })
  await session.close();
  return res.records;
}

async function getSettingPropertiesQuery(gID){
  let session = driver.session({ database: "neo4j" });
  let res = await session.run(
    `MATCH (g:Guild{gID:$gID})-->(s:Setting) return properties(s)`,{gID:gID},{ database: "neo4j" })
  await session.close();
  return res.records[0]._fields[0];
}

async function ToggleURLForgetfulnessQuery(gID){
  let session = driver.session({ database: "neo4j" });
  let res = await session.run(
    `MATCH (:Guild{gID:$gID})-->(s:Setting) 
    SET s.deleteAfterRepost= NOT s.deleteAfterRepost 
    return s.deleteAfterRepost as repostBool`,{gID:gID},{ database: "neo4j" })
  await session.close();
  return res.records[0]._fields[0];
}

async function DirectForgetLinkQuery(gID,URLs){
  let session = driver.session({ database: "neo4j" });
  let res = await session.run(`
  CREATE (n:var{arr:[]})
  with $URLs as URLs,n
  CALL(URLs,n){
    UNWIND URLs as element
    OPTIONAL MATCH (g:Guild{gID: $gID})--(u:User)--(url:URL{body: element}) 
    SET n.arr=n.arr+[url IS NULL]
    Detach delete url with g,u match (g)--(u) where NOT (u)-->() detach delete u
  }
  with n,n.arr as res
  DELETE n
  with res
  UNWIND res as element
  RETURN element
    `,{gID:gID,URLs:URLs},{ database: "neo4j" });
  await session.close();
  return res.records;
}
//TODO replace (g:Guild{gID: $gID}) with WHERE g.gID = $gID
//based on https://neo4j.com/docs/cypher-manual/5/indexes/search-performance-indexes/managing-indexes/#create-a-single-property-range-index-for-nodes
async function verifyConnectivityQuery(){
  return await driver.getServerInfo();
}
module.exports = {
  mergeGuildQuery,
  deleteGuildAndContentQuery,
  findLinkThenMergeOrDeleteQuery,
  updateTimeOutSettingDuration,
  checkModeOfEachGuildQuery,
  ChangeModeQuery,
  GetURLsQuery,
  getSettingPropertiesQuery,
  ToggleURLForgetfulnessQuery,
  DirectForgetLinkQuery,
  verifyConnectivityQuery
};
