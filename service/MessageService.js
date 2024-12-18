const {mergeGuildQuery,deleteGuildAndContentQuery,findLinkThenMergeOrDeleteQuery,checkModeOfEachGuildQuery} = require('../repository/Repository.js')

async function mergeGuild(gID){
    await mergeGuildQuery(gID)
  }
async function deleteGuildAndContent(gID){
  await deleteGuildAndContentQuery(gID)
}
function findLink(content){
  const regex =
  /(?:http[s]?:\/\/[www]?.)[A-Za-z0-9.-]+(?:\/[\+~%\/.\w_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*)/g;

  let output = [];
  let m;
  while ((m = regex.exec(content)) !== null) {
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    output.push(m);
  }
  return output;
}
async function assessLink(links,message){
  let res = await findLinkThenMergeOrDeleteQuery(links,message.guildId,message.author.id);
  return res;

}
async function messageRepost(links,message){
  links.forEach(async element => {
    await message.channel.send(
      "HEY GUYS CHECK OUT THIS BRAND NEW LINK I FOUND! " + element._url
    );
  });
}

async function DeleteAndNotifyMessage(links,message){
  let msgStr = "Woops, deleting your message because"
  links.forEach(element=>{
    let user = message.client.users.cache.find((user) => user.id == element._user);
    msgStr+="\n"+user.displayName+" had already posted "+element._url
  })
  await message.channel.send(msgStr)
  await message.delete()
}

async function checkModeOfEachGuild(gID){
  return await checkModeOfEachGuildQuery(gID)
}
  module.exports = {
    mergeGuild,
    deleteGuildAndContent,
    findLink,
    assessLink,
    messageRepost,
    checkModeOfEachGuild,
    DeleteAndNotifyMessage
  }