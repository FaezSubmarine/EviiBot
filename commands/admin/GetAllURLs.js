const { SlashCommandBuilder,PermissionFlagsBits } = require('discord.js');
const {GetURLs} = require('../../service/AdminService.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('getallurls')
		.setDescription('Gets all the URLs Evii Bot remembered.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
		async execute(interaction) {
			try{
                let res = await GetURLs(interaction.guildId)
                let msg = "Sure thing! Here's all the URL I remembered from this server: ";
				//console.log(res)
                res.forEach(element => {
					let user = interaction.client.users.cache.find((user) => user.id == element._fields[0]).displayName;
					msg+=`\nuser: ${user} URL: <${element._fields[1]}>`
                });
                await interaction.reply(msg);  
			}
			catch(e){
				console.log(e)
				await interaction.reply(e);
			}
		}
};