const {mergeGuildQuery,deleteGuildAndContentQuery,findLinkThenMergeOrDeleteQuery,checkModeOfEachGuildQuery} = require('../repository/Repository.js')

async function mergeGuild(gID){
    let arrayQStr = `'${gID.join('\',\'')}'`;
    await mergeGuildQuery(arrayQStr)
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
  //todo: seperate this then make another outcome of repost link

}
async function messageRepost(links,message){
  if(links.length==0)return;
  links.forEach(async element => {
    await message.channel.send(
      "HEY GUYS CHECK OUT THIS BRAND NEW LINK I FOUND! " + element
    );
  });
}

async function DeleteAndNotifyMessage(links,message){
  if(links.length==0)return;
  //todo: get user who posted the original  link
  let msgStr = "Woops, deleting your message  because someone else already posted these links: <"+links.join(">\n<")+">"
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