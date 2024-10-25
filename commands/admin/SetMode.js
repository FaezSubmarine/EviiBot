const { SlashCommandBuilder,PermissionFlagsBits } = require('discord.js');
const {CheckInputForMode,ChangeMode} = require('../../service/AdminService.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setmode')
		.setDescription('Set how Evii Bot react to the repost.')
		.addStringOption(option=>
			option.setName('input')
			.setDescription('0: Response Mode, 1: Delete Mode')
			.setRequired(true)
		
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
		async execute(interaction) {
			try{
                let input = CheckInputForMode(interaction)
                await ChangeMode(interaction.guildId,input)
                await interaction.reply("Mode has successfully changed to "+input);  
			}
			catch(e){
				console.log(e)
				await interaction.reply(e);
			}
		}
};