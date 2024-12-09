const { SlashCommandBuilder,PermissionFlagsBits } = require('discord.js');
const {ToggleURLForgetfulness} = require('../../service/AdminService.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('forgeturltoggle')
		.setDescription('If enabled, the bot will forget links after the repost had been posted.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
		async execute(interaction) {
			try{
				let res = await ToggleURLForgetfulness(interaction.guildId)
                await interaction.reply(`Gotcha, I will ${(res==true)?``:`not `}forget links after a repost`);  
			}
			catch(e){
				console.log(e)
				await interaction.reply(e);
			}
		}
};