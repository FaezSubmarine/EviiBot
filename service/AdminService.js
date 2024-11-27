const {
  updateTimeOutSettingDuration,
  deleteDueURLQuery,
  updateBackgroundJobsQuery,
  ChangeModeQuery,
  GetURLsQuery,
  getSettingPropertiesQuery,
  ToggleURLForgetfulnessQuery,
  DirectForgetLinkQuery,
  verifyConnectivityQuery
} = require("../repository/Repository.js");

const daysAndHoursRegex = /((?<day>[0-9]+)d)?(?<hour>[0-9]+)h/m;

const HARDLIMITONDAYS = 7;
function checkInput(interaction) {
  let str = interaction.options.getString("input");

  const res = daysAndHoursRegex.exec(str);
  if (res == null) {
    throw "Oops, that's not how you do an input!";
  }
  let { day, hour } = res.groups;
  if (isNaN(day)) day = 0;

  let noOfDays = Number(day);
  let noOfHours = Number(hour);
  if (noOfDays == 0 && noOfHours == 0) {
    throw "Oops, you can't set it all at 0";
  }
  let additionalDays = Math.floor(noOfHours / 24);
  if (additionalDays > 0) {
    noOfDays += additionalDays;
    noOfHours = noOfHours % 24;
  }
  if (noOfDays >= HARDLIMITONDAYS) {
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

async function deleteDueURL(res, gID) {
  await deleteDueURLQuery(res, gID);
}
async function updateBackgroundJobs(gID) {
  await updateBackgroundJobsQuery(gID);
}

async function ChangeMode(gID, mode) {
  await ChangeModeQuery(gID, mode);
}

async function GetURLs(gID) {
  return await GetURLsQuery(gID);
}

async function getSettingProperties(gID) {
    return await getSettingPropertiesQuery(gID);
}

function CreateMessageForSettingProperties(res){
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
            msgMode = "1) Delete Mode"
            break;
    } 

    let msg = `Sure thing! Here's all the setting properties:
    \nTime Out: ${msgDay}${msgHour}
    \nMode: ${msgMode}`;

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
  deleteDueURL,
  updateBackgroundJobs,
  ChangeMode,
  CheckInputForMode,
  GetURLs,
  getSettingProperties,
  CreateMessageForSettingProperties,
  ToggleURLForgetfulness,
  DirectForgetLink,
  verifyConnectivity
};
