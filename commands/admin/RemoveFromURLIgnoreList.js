const { SlashCommandBuilder,PermissionFlagsBits } = require('discord.js');
const {removeDomainFromIgnoreList} = require('../../service/AdminService.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('removefromurlignorelist')
		.setDescription('Remove a domain from a url ignore list')
		.addStringOption(option=>
			option.setName('domain')
			.setDescription('give the bot a domain to remove IE tenor.com')
			.setRequired(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
		async execute(interaction) {
			try{
				let URLs = interaction.options.getString("domain").split(' ')
				if(URLs.length==0){
					await interaction.reply(`Oops, looks like you didnt post any domains. Please try again`);
					return;
				}
				let res = await removeDomainFromIgnoreList(interaction.guildId,URLs)
                if(res.length==0){
                    await interaction.reply("Hmm, the URL you've given me does not match anything in the URL ignore list.");
                    return;  
                }
				let msg = "Got it! Removed ";
				for(let i = 0;i< res.length;++i){
					msg+= (i==res.length-1 && res.length!=1)?(`and ${res[i]} `):(res[i]+" ")
				}
                msg+= "from the URL ignore list."
                await interaction.reply(msg);  
			}
			catch(e){
				console.log(e)
				await interaction.reply(e);
			}
		}
};