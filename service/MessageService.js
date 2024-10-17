const {mergeGuildQuery,updateTimeoutsAfterBootQuery,deleteDueURLQuery,deleteGuildAndContentQuery,findLinkThenMergeOrDeleteQuery} = require('../repository/Repository.js')

async function mergeGuild(gID){
    let arrayQStr = `'${gID.join('\',\'')}'`;
    await mergeGuildQuery(arrayQStr)
  }

  async function updateTimeoutAfterBoot(guilds){
    await updateTimeoutsAfterBootQuery(guilds);
  }
async function deleteDueURLs(guilds){
  await deleteDueURLQuery(guilds)
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

  res.forEach(async element => {
    message.channel.send(
      "HEY GUYS CHECK OUT THIS BRAND NEW LINK I FOUND! " + element
    );
  });
}
  module.exports = {
    mergeGuild,
    updateTimeoutAfterBoot,
    deleteDueURLs,
    deleteGuildAndContent,
    findLink,
    assessLink
  }