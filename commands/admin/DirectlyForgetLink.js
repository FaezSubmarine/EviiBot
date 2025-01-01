const { SlashCommandBuilder,PermissionFlagsBits } = require('discord.js');
const {DirectForgetLink} = require('../../service/AdminService.js');
const {findLink} = require('../../service/MessageService.js')
module.exports = {
	data: new SlashCommandBuilder()
		.setName('directlyforgetlink')
		.setDescription('Remove a link thats stored in the database')
		.addStringOption(option=>
			option.setName('url')
			.setDescription('the exact url you want the bot to forget')
			.setRequired(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
		async execute(interaction) {
			try{
				let URLs = findLink(interaction.options.getString("url"))
				if(URLs.length==0){
					await interaction.reply(`Oops, looks like you didnt post any URLs. Please try again`);
					return;
				}
				let res = await DirectForgetLink(interaction.guildId,URLs)
				let msg = "";
				for(let i = 0;i< URLs.length;++i){
					let element = res[i]._fields[0];
					msg+= element?(`Hmmm, I never seen <${URLs[i]}> before\n`):
								  (`Got it! <${URLs[i]}> has been forgotten\n`)
				}
                await interaction.reply(msg);  
			}
			catch(e){
				console.log(e)
				await interaction.reply(e);
			}
		}
};