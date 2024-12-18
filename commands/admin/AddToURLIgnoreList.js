const { SlashCommandBuilder,PermissionFlagsBits } = require('discord.js');
const {insertDomainIntoIgnoreList} = require('../../service/AdminService.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('addtourlignorelist')
		.setDescription('The bot works by storing the link in a database, then.')
		.addStringOption(option=>
			option.setName('domain')
			.setDescription('give the bot a domain to ignore IE tenor.com')
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
				let res = await insertDomainIntoIgnoreList(interaction.guildId,URLs)
				let msg = "Got it! Added ";
				for(let i = 0;i< res.length;++i){
					msg+= (i==res.length-1 && res.length!=1)?(`and ${res[i]} `):(res[i]+" ")
				}
                msg+= "into the URL ignore list."
                await interaction.reply(msg);  
			}
			catch(e){
				console.log(e)
				await interaction.reply(e);
			}
		}
};