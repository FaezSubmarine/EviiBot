const { SlashCommandBuilder } = require('discord.js');
const {checkInput,updateTimeOutSetting} = require('../../service/AdminService.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('settimeout')
		.setDescription('Set how long does it take for EviiBot to forget a link.')
		.addStringOption(option=>
			option.setName('input')
			.setDescription('e.g 1d1h where d is the number of days and h is the number of hours. Minimum is 1 hour')
			.setRequired(true)
		),
		async execute(interaction) {
			try{
				const res = checkInput(interaction);
				await updateTimeOutSetting(res,interaction.guildId)
				await interaction.reply(`successfully set time at ${res.day} day and ${res.hour} hour`)
				//TODO: do a check on all links to delete if the date had expired
			}
			catch(e){
				console.log(e)
				await interaction.reply(e);
			}

	}
};