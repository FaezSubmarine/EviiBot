const { SlashCommandBuilder,PermissionFlagsBits } = require('discord.js');
const {DirectForgetLink} = require('../../service/AdminService.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('directlyforgetlink')
		.setDescription('The bot works by storing the link in a database, then.')
		.addStringOption(option=>
			option.setName('url')
			.setDescription('the exact url you want the bot to forget')
			.setRequired(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
		async execute(interaction) {
			try{
				//TODO: turn this into multiple urls
				let url = interaction.options.getString("url")
				let res = await DirectForgetLink(interaction.guildId,url)
                await interaction.reply(res==0?(`Hmmm, I never seen ${url} before`):(`Got it! ${url} has been forgotten`));  
			}
			catch(e){
				console.log(e)
				await interaction.reply(e);
			}
		}
};