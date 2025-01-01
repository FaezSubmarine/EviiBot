const {
  updateTimeOutSettingDuration,
  ChangeModeQuery,
  GetURLsQuery,
  resetGuildQuery,
  getSettingPropertiesQuery,
  ToggleURLForgetfulnessQuery,
  DirectForgetLinkQuery,
  insertDomainIntoIgnoreListQuery,
  insertUserIntoIgnoreListQuery,
  removeUserFromIgnoreListQuery,
  removeDomainFromIgnoreListQuery,
  verifyConnectivityQuery
} = require("../repository/Repository.js");

const daysAndHoursRegex = /((?<day>[0-9]+d))?(?<hour>[0-9]+h)?/;

const HARDLIMITONDAYS = 7;
function checkInput(interaction) {
  let str = interaction.options.getString("input");

  const res = daysAndHoursRegex.exec(str);
  //Acceptable inputs should be:
  //1d1h
  //10d10h
  //10d
  //10h
  if (res == null) {
    throw "Oops, that's not how you do an input!";
  }
  let { day, hour } = res.groups;

  let noOfDays = (day  ===undefined)  ?0:Number(day.substring(0,day.length-1));
  let noOfHours = (hour===undefined)  ?0:Number(hour.substring(0,hour.length-1));
  if (noOfDays == 0 && noOfHours == 0) {
    throw "Oops, you can't set it all at 0";
  }
  let additionalDays = Math.floor(noOfHours / 24);
  if (additionalDays > 0) {
    noOfDays += additionalDays;
    noOfHours = noOfHours % 24;
  }
  if ((noOfDays > HARDLIMITONDAYS) ||
      (noOfDays == HARDLIMITONDAYS && noOfHours>0)
    ) {
    throw "Oops, you're going above the limit!";
  }
  return { day: noOfDays, hour: noOfHours };
}
function CheckInputForMode(interaction) {
  let str = interaction.options.getString("input");
  let res = /[01]/gm.exec(str);
  if (res == null) {
    throw "Oops, that's not how you do an input!";
  }
  return res[0];
}
async function updateTimeOutSetting(changes, guild) {
  await updateTimeOutSettingDuration(changes, guild);
}
async function ChangeMode(gID, mode) {
  await ChangeModeQuery(gID, mode);
}

async function GetURLs(gID) {
  return await GetURLsQuery(gID);
}
async function resetGuild(gID){
  await resetGuildQuery(gID);
}
async function getSettingProperties(gID) {
    return await getSettingPropertiesQuery(gID);
}

async function insertDomainIntoIgnoreList(gID,domains){
  return await insertDomainIntoIgnoreListQuery(gID,domains)
}
async function removeDomainFromIgnoreList(gID,domains){
  return await removeDomainFromIgnoreListQuery(gID,domains)
}
async function insertUserIntoIgnoreList(gID,users){
  return await insertUserIntoIgnoreListQuery(gID,users)
}
async function removeUserFromIgnoreList(gID,users){
  return await removeUserFromIgnoreListQuery(gID,users)
}

function CreateMessageForSettingProperties(res,userRes){
    const intDays = res.timeOut.days.low;
    const intHours = res.timeOut.seconds.low/3600;

    const msgDay = (intDays == 0)?'':
                   (intDays == 1)?`1 day and `:
                   `${intDays} days and `;

    const msgHour = (intHours == 1)?`1 hour`: `${intHours} hours`
    let msgMode = ""
    switch (res.mode.low){
        case 0:
            msgMode = "0: Response Mode"
            break;
        case 1:
            msgMode = "1: Delete Mode"
            break;
    } 

    let msgURLIgnoreList = res.URLIgnoreList.join()
    let msgUserIgnoreList = res.userIgnoreList.map(user=>{
      let userClass = userRes.find(u=>u.user.id==user)
      return userClass.user.username
    }).join()
    let msg = `Sure thing! Here's all the setting properties:
    \nTime Out: ${msgDay}${msgHour}
    \nMode: ${msgMode}
    \nURL Ignore List: ${msgURLIgnoreList}
    \nUser Ignore List: ${msgUserIgnoreList}`;

    return msg;
}

async function ToggleURLForgetfulness(gID){
  return ToggleURLForgetfulnessQuery(gID)
}

async function DirectForgetLink(gID,url){
  return DirectForgetLinkQuery(gID,url)
}

async function verifyConnectivity(){
  return await verifyConnectivityQuery();
}

module.exports = {
  checkInput,
  updateTimeOutSetting,
  ChangeMode,
  CheckInputForMode,
  GetURLs,
  resetGuild,
  getSettingProperties,
  CreateMessageForSettingProperties,
  ToggleURLForgetfulness,
  DirectForgetLink,
  insertUserIntoIgnoreList,
  insertDomainIntoIgnoreList,
  removeDomainFromIgnoreList,
  removeUserFromIgnoreList,
  verifyConnectivity
};
