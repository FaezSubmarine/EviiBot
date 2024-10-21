const { SlashCommandBuilder,PermissionFlagsBits } = require('discord.js');
const {checkInput,updateTimeOutSetting,deleteDueURL,updateBackgroundJobs} = require('../../service/AdminService.js');
module.exports = {
	//todo: restrict this feature to certain roles
	data: new SlashCommandBuilder()
		.setName('settimeout')
		.setDescription('Set how long does it take for EviiBot to forget a link.')
		.addStringOption(option=>
			option.setName('input')
			.setDescription('e.g 1d1h where d is the number of days and h is the number of hours. Minimum is 1 hour')
			.setRequired(true)
		
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
		async execute(interaction) {
			try{
				// if(!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
				// 	throw "oops, you dont have the proper permissions to use this command!"
				// }
				const res = checkInput(interaction);
				await updateTimeOutSetting(res,interaction.guildId)
				await deleteDueURL(res,interaction.guildId)

				await updateBackgroundJobs(interaction.guildId)
				await interaction.reply(`successfully set time at ${res.day} day and ${res.hour} hour`)
			}
			catch(e){
				console.log(e)
				await interaction.reply(e);
			}

		}
};