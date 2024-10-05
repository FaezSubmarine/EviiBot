const daysAndHoursRegex = /((?<day>[0-9]+)d)?(?<hour>[0-9]+)h/m;

async function checkInput(interaction){
    let str = interaction.options.getString('input')
    
    const {day, hour} = daysAndHoursRegex.exec(str).groups;
    console.log(day+" "+hour);
    await interaction.reply(day+" "+hour);
}
module.exports={
    checkInput
}