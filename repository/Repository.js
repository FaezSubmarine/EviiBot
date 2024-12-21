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
  await session.run(`
    WITH $arrayQStr AS gIDs
    FOREACH ( element IN gIDs | MERGE (g:Guild{gID:element})
     MERGE (g)-[:hasSetting]->(s:Setting)
     ON CREATE SET s.timeOut=duration({hours:1}) 
     ON CREATE SET s.mode = 0 
     ON CREATE SET s.deleteAfterRepost = TRUE
     ON CREATE SET s.URLIgnoreList = $defaultURLIgnoreList
     ON CREATE SET s.userIgnoreList = []
    )`,{arrayQStr:arrayQStr,defaultURLIgnoreList:["tenor"]},{ database: "neo4j" }
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

      //outputs two fields: id and check
      //[0] outputs an ID in string if the url exists in the database
      //[1] outputs a bool that ouputs true if the user is not in the ignore list AND the URL itself isn't ignore
      const searchRes = await session.run(`
        MATCH (s:Setting)<--(g:Guild{gID: $gID})
        OPTIONAL MATCH (g)-->(u:User)-->(url:URL{body: $url})
        with (NOT $userID in s.userIgnoreList AND not any(word IN s.URLIgnoreList WHERE $url CONTAINS word)) as check,url
        return elementId(url) as id,check`
        ,{url:url,userID:userID,gID:gID},{ database: "neo4j" }
      );
      console.log(searchRes.records[0]._fields[1]);
      if(searchRes.records[0]._fields[1]==false){
        return;
      }
      console.log(searchRes.records[0]._fields[0]);
      if (searchRes.records[0]._fields[0] == null) {
        await session.run(
          `WITH $userID as userID, $gID as gID,$url as url
           MERGE (g:Guild {gID: gID}) 
           MERGE (g)-[:hasUser]->(u:User {uID:userID})
           CREATE (urlNode:URL{body:url}) set urlNode.datePosted = datetime() 
           CREATE (u)-[:posted]->(urlNode) WITH *
           return g`
        ,{userID:userID,gID:gID,url:url},{ database: "neo4j" })
      } else {
        let id = searchRes.records[0]._fields[0];
        const res = await session.run(`match (url:URL)<--(u:User)<--(g:Guild)-->(s:Setting) where elementId(url) = $id
                                      with u,CASE s.deleteAfterRepost WHEN true THEN url ELSE NULL end as urlRes
                                      DETACH DELETE urlRes with u,u.uID as uID MATCH (u) WHERE NOT (u)-->() detach delete u return uID`
                                      ,{id:id},{ database: "neo4j" });
        
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
async function insertDomainIntoIgnoreListQuery(gID,domains){
  let session = driver.session({ database: "neo4j" });

  let res = await session.executeWrite(async tx =>{
    return await tx.run(`
      MATCH (g:Guild{gID:$gID})-->(s:Setting)
      SET s.URLIgnoreList = s.URLIgnoreList+$domains
      return $domains
      `,{gID:gID,domains:domains}
    )
  })

  await session.close();
  return res.records[0]._fields[0];
}

async function removeDomainFromIgnoreListQuery(gID,domains){
  let session = driver.session({ database: "neo4j" });

  let res = await session.executeWrite(async tx =>{
    return await tx.run(`
      match (g:Guild{gID: $gID})-->(s:Setting)
      with [x in s.URLIgnoreList where x in $domains] as result,s
      set s.URLIgnoreList = [x in s.URLIgnoreList where NOT x in $domains] return result
      `,{gID:gID,domains:domains}
    )
  })

  await session.close();
  return res.records[0]._fields[0];
}

async function removeUserFromIgnoreListQuery(gID,users){
  let session = driver.session({ database: "neo4j" });

  let res = await session.executeWrite(async tx =>{
    return await tx.run(`
      match (g:Guild{gID: $gID})-->(s:Setting)
      with [x in s.userIgnoreList where x in $users] as result,s
      set s.userIgnoreList = [x in s.userIgnoreList where NOT x in $users] return result
      `,{gID:gID,users:users}
    )
  })

  await session.close();
  return res.records[0]._fields[0];
}
async function insertUserIntoIgnoreListQuery(gID,users){
  let session = driver.session({ database: "neo4j" });

  let res = await session.executeWrite(async tx =>{
    return await tx.run(`
      MATCH (g:Guild{gID:$gID})-->(s:Setting)
      SET s.userIgnoreList = s.userIgnoreList+$users
      return $users
      `,{gID:gID,users:users}
    )
  })

  await session.close();
  return res.records[0]._fields[0];
}
async function ToggleURLForgetfulnessQuery(gID){
  let session = driver.session({ database: "neo4j" });
  const res = await session.run(
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
  insertDomainIntoIgnoreListQuery,
  removeDomainFromIgnoreListQuery,
  removeUserFromIgnoreListQuery,
  insertUserIntoIgnoreListQuery,
  verifyConnectivityQuery
};
