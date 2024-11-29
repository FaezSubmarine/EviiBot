const { SlashCommandBuilder,PermissionFlagsBits } = require('discord.js');
const {getSettingProperties,CreateMessageForSettingProperties} = require('../../service/AdminService.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('getsettingproperties')
		.setDescription('Gets all the settings set for Evii Bot for this server.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
		async execute(interaction) {
			try{
                let res = await getSettingProperties(interaction.guildId)
                
                await interaction.reply(CreateMessageForSettingProperties(res));  
			}
			catch(e){
				await interaction.reply(e);
			}
		}
};