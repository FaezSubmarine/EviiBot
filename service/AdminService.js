const{updateTimeOutSettingDuration} = require('../repository/Repository.js')

const daysAndHoursRegex = /((?<day>[0-9]+)d)?(?<hour>[0-9]+)h/m;

const HARDLIMITONDAYS = 7
function checkInput(interaction){
    let str = interaction.options.getString('input')
    
    const res = daysAndHoursRegex.exec(str)
    if(res==null){
        throw "Oops, that's not how you do an input!";
    }
    let {day, hour} = res.groups;
    if(isNaN(day))day = 0;

    let noOfDays  = Number(day);
    let noOfHours = Number(hour);
    if(noOfDays == 0 && noOfHours == 0){
        throw "Oops, you can't set it all at 0"
    }
    let additionalDays = Math.floor(noOfHours/24);
    if(additionalDays > 0){
        noOfDays+=additionalDays;
        noOfHours = noOfHours%24;
    }
    if(noOfDays>=HARDLIMITONDAYS){
        throw "Oops, you're going above the limit!"
    }
    return {day:noOfDays,hour:noOfHours}
}

async function updateTimeOutSetting(changes,guild){
    updateTimeOutSettingDuration(changes,guild)
}

module.exports={
    checkInput,updateTimeOutSetting
}